import crypto from 'crypto';

const SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';
const APP_ID = process.env.TENCENT_SMS_APP_ID || '';
const SIGN_NAME = process.env.TENCENT_SMS_SIGN_NAME || '';
const TEMPLATE_ID = process.env.TENCENT_SMS_TEMPLATE_ID || '';

function hmacsha256(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function sha256hex(msg: string) {
  return crypto.createHash('sha256').update(msg).digest('hex');
}

export async function sendSms(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
  if (!SECRET_ID || !SECRET_KEY || !APP_ID || !SIGN_NAME || !TEMPLATE_ID) {
    return { success: false, message: '腾讯云短信配置不完整' };
  }

  const region = 'ap-guangzhou';
  const service = 'sms';
  const action = 'SendSms';
  const version = '2021-01-11';
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().substr(0, 10);

  const payload = JSON.stringify({
    PhoneNumberSet: [phoneNumber.startsWith('+86') ? phoneNumber : `+86${phoneNumber}`],
    SmsSdkAppId: APP_ID,
    SignName: SIGN_NAME,
    TemplateId: TEMPLATE_ID,
    TemplateParamSet: [code, '5'],
  });

  const algorithm = 'TC3-HMAC-SHA256';
  const httpRequestMethod = 'POST';
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const canonicalHeaders = 'content-type:application/json\nhost:sms.tencentcloudapi.com\n';
  const signedHeaders = 'content-type;host';
  const hashedRequestPayload = sha256hex(payload);
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;

  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = sha256hex(canonicalRequest);
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

  const secretDate = hmacsha256(`TC3${SECRET_KEY}`, date);
  const secretService = hmacsha256(secretDate, service);
  const secretSigning = hmacsha256(secretService, 'tc3_request');
  const signature = hmacsha256(secretSigning, stringToSign).toString('hex');

  const authorization = `${algorithm} Credential=${SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const response = await fetch('https://sms.tencentcloudapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'sms.tencentcloudapi.com',
        'Authorization': authorization,
        'X-TC-Action': action,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Version': version,
        'X-TC-Region': region,
      },
      body: payload,
    });

    const result = await response.json();
    if (result.Response.Error) {
      return { success: false, message: result.Response.Error.Message };
    }
    return { success: true, message: '发送成功' };
  } catch (error) {
    return { success: false, message: '发送失败' };
  }
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
