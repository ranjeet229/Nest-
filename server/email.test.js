import test from 'node:test';
import assert from 'node:assert/strict';
import {welcomeMessage,sendWelcomeEmail,pendingWelcome,gmailTransportOptions,gmailFailure,processWelcomeQueue} from './email.js';
const user={_id:'first',name:'Alex <script>alert(1)</script>',email:'alex@example.com'};
const env={GMAIL_APP_PASSWORD:'abcd efgh ijkl mnop',APP_URL:'https://shop.example.com'};

test('signup email has fixed Gmail sender, dynamic recipient and requested reply address',()=>{
  for(const email of ['first@example.com','second@example.com']){
    const message=welcomeMessage({...user,email},env);
    assert.deepEqual(message.from,{name:'Nest',address:'kiranjeetkr80@gmail.com'});
    assert.deepEqual(message.to,[email]);
    assert.equal(message.replyTo,email);
    assert.match(message.text,/successfully signed up/);
    assert.ok(!message.html.includes('<script>'));
    assert.match(message.html,/&lt;script&gt;/);
  }
});
test('Gmail transport uses TLS and the sender account app password',()=>{
  const options=gmailTransportOptions(env);
  assert.equal(options.host,'smtp.gmail.com');assert.equal(options.port,465);assert.equal(options.secure,true);
  assert.deepEqual(options.auth,{user:'kiranjeetkr80@gmail.com',pass:'abcdefghijklmnop'});
});
test('missing App Password pauses sending even if old Resend credentials exist',async()=>{
  const result=await sendWelcomeEmail(user,{env:{RESEND_API_KEY:'old-key',EMAIL_FROM:'old@example.com'},createTransport:()=>{throw Error('Must not send')}});
  assert.deepEqual(result,{status:'not_configured'});
});
test('each new user receives its own message and obsolete Resend payload is ignored',async()=>{
  const sent=[];
  let closed=0;
  for(const email of ['first@example.com','second@example.com']){
    const result=await sendWelcomeEmail({...user,email,welcomeEmail:{payload:{from:'old@example.com',to:['wrong@example.com']}}},{env,createTransport:()=>({
      sendMail:async message=>{sent.push(message);return {accepted:message.to,messageId:'gmail-id'}},
      close:()=>{closed++}
    })});
    assert.equal(result.status,'accepted');
  }
  assert.deepEqual(sent.map(message=>message.to),[['first@example.com'],['second@example.com']]);
  assert.equal(closed,2);
});
test('rejects invalid recipient before contacting Gmail',async()=>{
  await assert.rejects(sendWelcomeEmail({...user,email:'bad\r\nBcc: other@example.com'},{env,createTransport:()=>{throw Error('Must not send')}}));
});
test('only known temporary failures retry; ambiguous DATA timeout needs review',()=>{
  assert.equal(gmailFailure({responseCode:451}).retryable,true);
  assert.equal(gmailFailure({code:'ETIMEDOUT',command:'CONN'}).retryable,true);
  assert.equal(gmailFailure({code:'EAUTH'}).retryable,false);
  assert.equal(gmailFailure({responseCode:550}).retryable,false);
  assert.equal(gmailFailure({code:'ETIMEDOUT',command:'DATA'}).retryable,false);
});
test('SMTP rejection never reports successful delivery',async()=>{
  await assert.rejects(sendWelcomeEmail(user,{env,createTransport:()=>({sendMail:async()=>({accepted:[],rejected:[user.email]}),close(){}})}),e=>e.retryable===false);
});
test('authentication errors do not expose provider details or credentials',async()=>{
  await assert.rejects(sendWelcomeEmail(user,{env,createTransport:()=>({sendMail:async()=>{throw Object.assign(Error('secret-provider-response'),{code:'EAUTH'})},close(){}})}),e=>!e.message.includes('secret-provider-response')&&e.message.includes('GMAIL_APP_PASSWORD'));
});
test('queue records accepted messages and never turns a DB update failure into a resend',async()=>{
  let sends=0,updates=0;
  const model={updateMany:async()=>{},findOneAndUpdate:async()=>({...user,welcomeEmail:{attempts:1}}),updateOne:async()=>{updates++;throw Error('Database offline')}};
  await assert.rejects(processWelcomeQueue(model,{send:async()=>{sends++;return {status:'accepted',providerId:'id'}}}));
  assert.equal(sends,1);assert.equal(updates,1);
});
test('queue retries explicit temporary failures but stops after five attempts',async()=>{
  for(const attempts of [1,5]){
    let update;
    const model={updateMany:async()=>{},findOneAndUpdate:async()=>({...user,welcomeEmail:{attempts}}),updateOne:async(query,value)=>{update=value}};
    await processWelcomeQueue(model,{send:async()=>{throw Object.assign(Error('Temporary failure'),{retryable:true})}});
    assert.equal(update.$set['welcomeEmail.status'],attempts===1?'pending':'failed');
  }
});
test('new accounts start pending, not sent',()=>{
  const state=pendingWelcome();assert.equal(state.status,'pending');assert.equal(state.attempts,0);
});
