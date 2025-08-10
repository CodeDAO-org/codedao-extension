require('dotenv').config();

console.log('=== Environment Variable Test ===');
console.log('BOT_TOKEN exists:', !!process.env.BOT_TOKEN);
console.log('BOT_TOKEN length:', process.env.BOT_TOKEN ? process.env.BOT_TOKEN.length : 0);
console.log('ADMIN_CHAT_ID:', process.env.ADMIN_CHAT_ID);
console.log('TWITTER_API_KEY exists:', !!process.env.TWITTER_API_KEY);

if (process.env.BOT_TOKEN) {
  console.log('✅ Bot token loaded successfully');
} else {
  console.log('❌ Bot token not found');
} 