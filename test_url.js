const url = 'mysql://qchmykxgcm_extractor:Turbo5max#@localhost:3306/qchmykxgcm_extractor';
const match = url.match(/mysql:\/\/[^:]+:([^@]+)@/);
if (match) {
  const pwd = match[1];
  console.log("pwd:", pwd);
  const fixedPwd = pwd.replace(/#/g, '%23');
  const fixedUrl = url.replace(`:${pwd}@`, `:${fixedPwd}@`);
  console.log("fixedUrl:", fixedUrl);
  try {
    new URL(fixedUrl);
    console.log("URL is valid now!");
  } catch (e) {
    console.log("Still invalid", e);
  }
}
