// utils/qzPrint.js
import qz from "qz-tray";
import html2canvas from "html2canvas";
import jsrsasign from "jsrsasign"; // npm install jsrsasign

// Your PUBLIC certificate (must also be pasted into QZ Tray Settings → Security → Certificates)
const CERT = `
-----BEGIN CERTIFICATE-----
MIIDfjCCAmagAwIBAgIJAKde7MD9WQZ5MA0GCSqGSIb3DQEBDAUAMGIxCzAJBgNV
BAYTAlVTMQ4wDAYDVQQIEwVTdGF0ZTENMAsGA1UEBxMEQ2l0eTESMBAGA1UEChMJ
TXlDb21wYW55MQwwCgYDVQQLEwNEZXYxEjAQBgNVBAMTCWxvY2FsaG9zdDAeFw0y
NTA4MTExNTMxMjRaFw0zNTA4MDkxNTMxMjRaMGIxCzAJBgNVBAYTAlVTMQ4wDAYD
VQQIEwVTdGF0ZTENMAsGA1UEBxMEQ2l0eTESMBAGA1UEChMJTXlDb21wYW55MQww
CgYDVQQLEwNEZXYxEjAQBgNVBAMTCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBANx/zZPQt3Q3DsU2glwJm1LHj+B/VJu2UngmWO2NSs8L
+ME9CgADLPUEdU5tHCaCWELDZuGmzZCbgBOYCn85AkAqgowZOzWWE2YH3iCtkywe
vhV/HSBgdjqvqZ3pwXIlM0+0nWwkVAfKDAiQY8n2qlDX9CpMG8GSazd1o25dKPlH
I5U6eeU7O2o1uZdE5ziEmIShcdcLaLtAFf9j2CYl/sBQRss9UGAOc0UjTsUN6a1d
BMalyfxFVGXOyqpa67u1MXv05O0H+ROyv2N5AQttphzk6AW7/4VuNtfC9oX0LdBJ
Fleo+8IsubFlaybEs7rTNnBJAaZjEYWsoFKbqNkPy4ECAwEAAaM3MDUwHQYDVR0O
BBYEFCVUUvy2xZCfofr44fcPFR9lJps+MBQGA1UdEQQNMAuCCWxvY2FsaG9zdDAN
BgkqhkiG9w0BAQwFAAOCAQEAaj4zzDF6/9x5FEm44y7CeRGrn+V6fFiLSC4WPlyu
72MjHY3crF+GhtvtEi0a1aPHNy5WjhYi/5aPIIyhgYGYpjkPldyxCLGFm1SU9xEJ
VHM9ZK+KNYLSJ0vRvkKFKQMda7VK32ISHZeENZEFUIUcqLZHREo9X+Jec77cJWOl
PPffpmllkrWfKYB8cM3bHk3aW4kJs8a0T6ofRL5zfkU0VKO2B5IxjYq9te/40bIp
StZqXaSYMVMezW0mIC1iZmCv8ZuoVQCspOLWusqW8Jaw41Zbt8o2G5qIccif+jgN
k/KV60Xyua8u85vODS3VgEUvMb2u8vylOyHXt6sah3YGtA==
-----END CERTIFICATE-----
`;

// Your PRIVATE key
const PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDcf82T0Ld0Nw7F
NoJcCZtSx4/gf1SbtlJ4JljtjUrPC/jBPQoAAyz1BHVObRwmglhCw2bhps2Qm4AT
mAp/OQJAKoKMGTs1lhNmB94grZMsHr4Vfx0gYHY6r6md6cFyJTNPtJ1sJFQHygwI
kGPJ9qpQ1/QqTBvBkms3daNuXSj5RyOVOnnlOztqNbmXROc4hJiEoXHXC2i7QBX/
Y9gmJf7AUEbLPVBgDnNFI07FDemtXQTGpcn8RVRlzsqqWuu7tTF79OTtB/kTsr9j
eQELbaYc5OgFu/+FbjbXwvaF9C3QSRZXqPvCLLmxZWsmxLO60zZwSQGmYxGFrKBS
m6jZD8uBAgMBAAECggEAGMdrTfqtEGwlhp0RuOUYJY0pSoRp+NZcMzC1WqYVAOp/
/xCXIJmQF6LIyfzx+76Mdkg+NgqIMawqkEkhmNrKZB/tgW/5GumtbrsLR9HUZvy3
cMlS98dPUgNZRNaMN4HIX+MqCQlAwOAASoVraWVaY3EOo82KFaPuKj0tQLhLDqQu
CjNwGA+qOZOsQCVRh4k0e50GxpIHpEsPZYDfWwhem8+eXBfj/3eMOwoI2VL4htKa
3yAcdx/E7CZk2cLZ8ERgqQoqneqZxHheHySP+iLevdUG4Hviph5yrQ6cRbk3jyv0
Cuqub5vZ5c8IZdPrd1ACoZuWF3DOEE8zu0nEPvr8VwKBgQDpWQI9heGt15nN2nAQ
TH8ZdVmrjxCvPZ0HKOBoWsX6eslGmoTxX5OlOCEdNutdkexpLRIvWVB+V6GScIQZ
Xpqy7h2B6mxjDRoZMB5nAZSn1mGEsFqHsWvmn7uQeR2H0ed7HRIyTja+lfBqAtX6
vONAY7pfw8D42nXC4++dKJc7WwKBgQDx535UjESQx5GzoUsgdJ6ICjGLMSSnpdRh
nECiH8UQctigztJ493JFMVc4Srx4AvnbGRfrd9EwOZ2IxUJobGAOlwMqxBcsgRLP
LR0qWS+0rpSarqtkSAuf4GO4gw0SiPNhpeP1cWbebMS1DljkV0VTysXCn00huEHj
YGc51IU3UwKBgQCoNu4Sg8zokR/i8bEPTtXg+GOn9P5GFdh5LNJ459cIdjNanlFv
30KEPC5C7TBGx8bxGvidAXmxWmKzOkFAOJ60lkrXOLLhxLQnrDR+dPlA9J5gFPFu
GEx8eHGx+F19Z6fDbHWNpix4v4YMJfczRa9c34efOXKG8pUp5T76wCQlOQKBgQDC
j+V8zSCsrccTiiwpm4KSelhk0o7fxDHwnEMj4peWZji0BgUkxCkFW+0B2qKBiCs7
vJAPlFwNBJofEkEaSehsc6tZb0QQSHQ/a9KkZ/1FvpDJZKl3S7cFzO2Hzufpu3q9
VDboB2CsjyEbWsHGTib1gQbURVo9P7zGy5fa3IKU/wKBgQCeC5ZrsQo/WoKWE/v2
S8seWFa2RiNRN3LJNMp8F3f1km9h3lt7i7871HVbcPw8p9tds79fx8shFQHKjQA0
Kw0gQ1rVwktJT3c1mDywBWUvlXcODs/ei/9xC/ighZx76PJfSb3PFSf5yRlujZE6
M3MEbj1gxq/Ny9QFRivmNsuj6w==
-----END PRIVATE KEY-----
`;

qz.security.setCertificatePromise((resolve, reject) => {
  resolve(CERT);
});

qz.security.setSignaturePromise((toSign) => {
  return (resolve, reject) => {
    try {
      const sig = new jsrsasign.KJUR.crypto.Signature({ alg: "SHA1withRSA" });
      sig.init(PRIVATE_KEY);
      sig.updateString(toSign);
      resolve(jsrsasign.hextob64(sig.sign()));
    } catch (err) {
      reject(err);
    }
  };
});

export const connectQZ = async () => {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
};

export const printHTMLWithQZ = async (html) => {
  await connectQZ();

  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "0";
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  const canvas = await html2canvas(tempDiv, { scale: 2 });
  const imageData = canvas.toDataURL("image/png");

  document.body.removeChild(tempDiv);

  const printers = await qz.printers.find();
  console.log("Available printers:", printers);

  const config = qz.configs.create(printers[0], {
    copies: 1,
    margins: 0,
    scaleContent: true
  });

  const data = [{
    type: "image",
    format: "base64",
    data: imageData.split(",")[1], 
  }];

  return qz.print(config, data);
};
