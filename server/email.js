import nodemailer from 'nodemailer';
import {z} from 'zod';

export const GMAIL_SENDER='kiranjeetkr80@gmail.com';
// Transactional email only: no marketing pixels, external images or attachments.
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function emailConfigured(env=process.env){
  return !!env.GMAIL_APP_PASSWORD?.replace(/\s/g,'');
}

export function gmailTransportOptions(env=process.env){
  return {
    host:'smtp.gmail.com',port:465,secure:true,
    auth:{user:GMAIL_SENDER,pass:env.GMAIL_APP_PASSWORD?.replace(/\s/g,'')},
    connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,
    disableFileAccess:true,disableUrlAccess:true
  };
}

export function gmailFailure(error){
  if(error.code==='EAUTH')return {retryable:false,message:'Gmail authentication failed. Check GMAIL_APP_PASSWORD for kiranjeetkr80@gmail.com.'};
  if(error.responseCode>=400&&error.responseCode<500)return {retryable:true,message:'Gmail temporarily rejected the message; retry scheduled.'};
  if(error.responseCode>=500)return {retryable:false,message:'Gmail rejected the message. Check the sender account and recipient address.'};
  if(['EDNS','ECONNECTION','ESOCKET','ETIMEDOUT'].includes(error.code)&&['CONN','EHLO','HELO','STARTTLS'].includes(error.command))return {retryable:true,message:'Unable to connect to Gmail; retry scheduled.'};
  return {retryable:false,message:'Email delivery could not be confirmed. Check Gmail Sent before resending.'};
}

export async function sendWelcomeEmail(user,{env=process.env,createTransport=nodemailer.createTransport}={}){
  if(!emailConfigured(env))return {status:'not_configured'};
  const message=welcomeMessage(user,env);
  const transport=createTransport(gmailTransportOptions(env));
  try{
    // Never reuse an old Resend payload: sender and recipient come from the current account.
    const result=await transport.sendMail(message);
    if(!result.accepted?.some(address=>address.toLowerCase()===user.email.toLowerCase())){
      const error=new Error('Recipient was not accepted');error.responseCode=550;throw error;
    }
    return {status:'accepted',providerId:result.messageId};
  }catch(error){
    const failure=gmailFailure(error);
    throw Object.assign(new Error(failure.message),{retryable:failure.retryable});
  }finally{transport.close?.();}
}

export const pendingWelcome=()=>({status:'pending',attempts:0,nextAttemptAt:new Date()});

// The queue is stored with the new account so mail failures never undo signup.
export async function processWelcomeQueue(User,{send=sendWelcomeEmail,now=new Date()}={}){
  // SMTP has no idempotency API. A crashed attempt needs review rather than a duplicate send.
  await User.updateMany({'welcomeEmail.status':'sending','welcomeEmail.nextAttemptAt':{$lte:now}},{$set:{'welcomeEmail.status':'failed','welcomeEmail.lastError':'Interrupted delivery. Check Gmail Sent before resending.'}});
  const u=await User.findOneAndUpdate({
    'welcomeEmail.status':'pending','welcomeEmail.nextAttemptAt':{$lte:now},'welcomeEmail.attempts':{$lt:5}
  },{$set:{'welcomeEmail.status':'sending','welcomeEmail.nextAttemptAt':new Date(now.getTime()+300000)},$inc:{'welcomeEmail.attempts':1}},{new:true});
  if(!u)return;
  let result;
  try{result=await send(u);}catch(error){
    const retry=error.retryable===true&&u.welcomeEmail.attempts<5;
    await User.updateOne({_id:u._id},{$set:{
      'welcomeEmail.status':retry?'pending':'failed',
      'welcomeEmail.nextAttemptAt':new Date(now.getTime()+30000*2**u.welcomeEmail.attempts),
      'welcomeEmail.lastError':error.message
    },$unset:{'welcomeEmail.payload':1}});
    return;
  }
  // A DB failure after SMTP acceptance must not turn into an automatic resend.
  if(result.status==='not_configured'){
    await User.updateOne({_id:u._id},{$set:{'welcomeEmail.status':'pending'},$inc:{'welcomeEmail.attempts':-1}});
    return;
  }
  await User.updateOne({_id:u._id},{$set:{'welcomeEmail.status':'accepted','welcomeEmail.providerId':result.providerId,'welcomeEmail.acceptedAt':new Date()},$unset:{'welcomeEmail.payload':1,'welcomeEmail.lastError':1}});
}

export function startWelcomeWorker(User){
  let running=false;
  if(!emailConfigured())console.warn('Welcome email paused: add GMAIL_APP_PASSWORD in .env for kiranjeetkr80@gmail.com.');
  const timer=setInterval(async()=>{
    if(running||!emailConfigured()||User.db.readyState!==1)return;
    running=true;
    try{await processWelcomeQueue(User);}catch{console.warn('Welcome email queue update failed; check MongoDB connectivity.');}
    finally{running=false;}
  },5000);
  timer.unref();
  return ()=>clearInterval(timer);
}

export function welcomeMessage(user,env=process.env){
  const name=user.name?.trim()||'there';
  const url=new URL(env.APP_URL||'http://localhost:5173');
  if(!['http:','https:'].includes(url.protocol))throw new Error('Invalid APP_URL');
  const text=`Hi ${name},\n\nYou’ve successfully signed up for Nest. Your account is ready!\n\nYou can now save your favourites, shop your everyday essentials, and track your orders.\n\nVisit Nest: ${url.href}\n\nThanks for joining us,\nThe Nest team\n\nYou received this email because a Nest account was created with this email address. If this wasn’t you, you can ignore this message.`;
  return {
    from:{name:'Nest',address:GMAIL_SENDER},
    to:[z.email().parse(user.email)],
    subject:'Welcome to Nest — your account is ready!',
    replyTo:user.email,
    text,
    html:`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f3f4ed;font-family:Arial,sans-serif;color:#25392c"><div style="display:none;max-height:0;overflow:hidden">You’ve successfully signed up for Nest. Welcome home.</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffefa;border-radius:12px"><tr><td style="padding:36px"><div style="color:#176b4a;font-size:40px;font-weight:bold;letter-spacing:-2px">nest<span style="color:#b6c67c">.</span></div><p style="color:#176b4a;font-size:11px;letter-spacing:2px;margin-top:30px">WELCOME TO YOUR NEST</p><h1 style="font-size:28px;line-height:1.3">Good things start here.</h1><p style="font-size:15px;line-height:1.8">Hi ${escapeHtml(name)},</p><p style="font-size:15px;line-height:1.8">You’ve successfully signed up for Nest. <strong>Your account is ready!</strong></p><p style="font-size:15px;line-height:1.8;color:#687462">Save your favourites, discover everyday essentials, and keep track of your orders, all in one place.</p><p style="margin:30px 0"><a href="${escapeHtml(url.href)}" style="display:inline-block;background:#176b4a;color:#ffffff;padding:15px 24px;border-radius:6px;text-decoration:none;font-size:14px">Visit your Nest</a></p><p style="font-size:14px;line-height:1.8">Thanks for joining us,<br>The Nest team</p><hr style="border:0;border-top:1px solid #e5e9df;margin:28px 0"><p style="font-size:11px;line-height:1.7;color:#7b8474">You received this email because a Nest account was created with this email address. If this wasn’t you, you can ignore this message.</p></td></tr></table></td></tr></table></body></html>`
  };
}
