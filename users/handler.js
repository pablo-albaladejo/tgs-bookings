'use strict';

const https = require('https');

module.exports.hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.api = async (event) => {
  let dataString = '';

  const response = await new Promise((resolve, reject) => {
    const req = https.get('https://pokeapi.co/api/v2/pokemon/ditto', function (res) {
      res.on('data', chunk => {
        dataString += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: 200,
          body: JSON.stringify(JSON.parse(dataString), null, 4)
        });
      });
    });

    req.on('error', (e) => {
      reject({
        statusCode: 500,
        body: 'Something went wrong!'
      });
    });

  });

  return response;
};

const getAccessToken = (str) => {
  const result = JSON.parse(str);
  const responseObj = JSON.parse(result.d);
  const center = responseObj['Centros'][0];
  return center.accessToken;
}

const doLoginRequest = (user, pass) => {
  return new Promise((resolve, reject) => {

    const options = {
      host: 'tguser.com',
      path: '/webtouch/api/indexs/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const data = {
      user,
      pass,
    };

    //create the request object with the callback with the result
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(getAccessToken(body)));
    });

    // handle the possible errors
    req.on('error', (e) => {
      reject(e.message);
    });

    //do the request
    req.write(JSON.stringify(data));

    //finish the request
    req.end();
  });
}

const accessToken = `eyJhbGciOiJQQkVTMi1IUzI1NitBMTI4S1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwicDJjIjo4MTkyLCJwMnMiOiJ4SEtfdk9QR1VyRUlPWXBZIn0.gv-rM9WyzLJLUNHB_MKX-RHl2mIVlEz2-Ql657TVC_nArRZC95rWY4xdA1IZeaLe4H50qoodPehe0ieUUoqbWQN6SOs7AKLS.mDTJEbMCMiFAz_Cm5ANVjw.Yhr46sSk6ayQ56sgX7-ayUFyQvCLHwhSURYDJjEmcMRbRO3dvXWmrB8EJbZxGXL4WM9vpED-WBcMbOegDIRjXmHm_DtN86Hq8VJOxdKr4QSQdZ4QKLCn_cpHRspI_hoRy-9cy39YhSBNwcpDDw80bkb60BmRb8B0ro18vHvy6ehtWgOx_pe5oPXEoegG4VBw.0QC4DDtOhG_xEVtaR5BAy3C26rD0YHuJriPWbbOc7Xo`;

module.exports.bookActivity = async (event) => {
  //const accessToken = await doLoginRequest('pablofdi@gmail.com', 'sesamo12345');
  console.log(accessToken)
};