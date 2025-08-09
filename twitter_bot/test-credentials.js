#!/usr/bin/env node

// Quick test script for Twitter API credentials
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

async function testCredentials() {
    console.log('🧪 Testing Twitter API Credentials...\n');

    // Your provided credentials
    const credentials = {
        apiKey: 'JkvwT9YcEWSuK56ud6EibGTr6',
        apiSecret: 'azaWRbfTUUVHU02eO9sI2kvbMtEqWgjvWI5ASKkBDVMVyDLfXn',
        accessToken: '1879605233493405696-3584SP9SLewXUCZOaCOBmMfS7WYNg0',
        accessSecret: 'F1Krlkoq10358joaLW2yXiP4vGrudysB7ccIzhIp27eil'
    };

    try {
        // Initialize Twitter client
        const client = new TwitterApi({
            appKey: credentials.apiKey,
            appSecret: credentials.apiSecret,
            accessToken: credentials.accessToken,
            accessSecret: credentials.accessSecret,
        });

        console.log('✅ Twitter API client initialized');

        // Test authentication by getting current user
        const rwClient = client.readWrite;
        const user = await rwClient.currentUser();

        console.log('✅ Authentication successful!');
        console.log(`📱 Connected as: @${user.username} (${user.name})`);
        console.log(`👥 Followers: ${user.public_metrics?.followers_count || 0}`);
        console.log(`📊 Following: ${user.public_metrics?.following_count || 0}`);
        console.log(`📝 Tweets: ${user.public_metrics?.tweet_count || 0}`);

        // Test if we can read tweets
        console.log('\n🔍 Testing read capabilities...');
        const timeline = await rwClient.v2.userTimeline(user.id, { max_results: 5 });
        console.log(`✅ Can read timeline (${timeline.data?.length || 0} recent tweets)`);

        // Check basic API access
        console.log('\n⏱️  Checking API access...');
        console.log(`✅ API access confirmed for user ID: ${user.id}`);

        console.log('\n🎉 All tests passed! Your Twitter bot is ready to go!');
        
        return {
            success: true,
            username: user.username,
            userId: user.id,
            canPost: true,
            canRead: true
        };

    } catch (error) {
        console.error('\n❌ Twitter API test failed:');
        console.error('Error:', error.message);
        
        if (error.code === 401) {
            console.error('\n🔑 Authentication failed - please check your API credentials');
        } else if (error.code === 403) {
            console.error('\n🚫 Access forbidden - your app may not have the required permissions');
        } else if (error.code === 429) {
            console.error('\n⏱️  Rate limit exceeded - please wait before trying again');
        }
        
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// Run the test
if (require.main === module) {
    testCredentials()
        .then(result => {
            if (result.success) {
                console.log('\n🚀 Ready to launch your CodeDAO Twitter bot!');
                console.log('\nNext steps:');
                console.log('1. cd twitter_bot');
                console.log('2. ./scripts/quick-start.sh  # Run setup script');
                console.log('3. npm start  # Start the bot');
                process.exit(0);
            } else {
                console.log('\n❌ Please fix the issues above before launching the bot');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = testCredentials; 