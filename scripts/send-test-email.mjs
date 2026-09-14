import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {emailConfigured,sendWelcomeEmail,GMAIL_SENDER} from '../server/email.js';

const recipient=process.argv[2]?.trim();
if(!z.email().safeParse(recipient).success){
  console.error('Provide the recipient: npm.cmd run email:test -- user@example.com');
  process.exitCode=1;
}else if(!emailConfigured()){
  console.error(`Add GMAIL_APP_PASSWORD in .env for ${GMAIL_SENDER}. Use a Google App Password, not your normal password.`);
  process.exitCode=1;
}else{
  try{
    const result=await sendWelcomeEmail({_id:randomUUID(),email:recipient,name:'there'});
    console.log('Welcome email accepted by Gmail. Message ID:',result.providerId);
  }catch(error){console.error(error.message);process.exitCode=1;}
}
