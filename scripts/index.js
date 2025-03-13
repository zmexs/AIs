/* eslint-disable no-undef */
const http = require('http');
const TencentCloudCommon = require('tencentcloud-sdk-nodejs-common');
const CommonClient = TencentCloudCommon.CommonClient;

const config = require('./static');

const server = http.createServer(async (req, res) => {
    if (req.url === '/getDemoToken') {
        try {
            console.log('【getDemoToken】---config--->', config);
            const clientConfig = {
                credential: {
                    secretId: config.secretId,
                    secretKey: config.secretKey
                },
                region: 'ap-guangzhou',
                profile: {
                    httpProfile: {
                        endpoint: 'lke.ap-guangzhou.tencentcloudapi.com'
                    }
                }
            };

            const client = new CommonClient(
                'lke.ap-guangzhou.tencentcloudapi.com',
                '2023-11-30',
                clientConfig
            );
            const params = {
                'Type': 5,
                'BotAppKey': config.appId,
                'VisitorBizId': config.appId
            };
            const apiResponse = await client.request('GetWsToken', params);
            console.log('【getDemoToken】---rep--->', apiResponse);

            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9092');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ apiResponse }));
        } catch (error) {
            console.error(error);
            res.statusCode = 500;
            res.end();
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
