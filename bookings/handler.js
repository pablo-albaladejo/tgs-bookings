'use strict';
const https = require('https');

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
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
      resolve({ cookie: res.headers['set-cookie'][0] })
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

const getSchedulesRequestByDates = (cookie, startDate, endDate) => {

  return new Promise((resolve, reject) => {

    const options = {
      host: 'tguser.com',
      path: `/webtouch/api/usuarios/reservas/getSchedulesApp/iframe?startDateTime=${startDate}&endDateTime=${endDate}`,
      method: 'GET',
      headers: {
        'Cookie': cookie,
      }

    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', (e) => {
      reject(e.message);
    });

    //do the request
    req.write(`data\n`);

    //finish the request
    req.end();

  });
}

const getBookingIdByActivityId = (activityId, activityNumber, schedules) => {
  const scheduleList = JSON.parse(schedules).calendar[0].schedules;
  const list = scheduleList.filter(schedule => schedule.activity.id === +activityId);
  return "" + list[activityNumber].id;
}

const getBookingInfoRequestById = (cookie, bookingId) => {

  return new Promise((resolve, reject) => {

    const options = {
      host: 'tguser.com',
      path: `/webtouch/api/usuarios/reservas/getInfoDetailForSchedule/${bookingId}/iframe`,
      method: 'GET',
      headers: {
        'Cookie': cookie,
      }

    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', (e) => {
      reject(e.message);
    });

    //do the request
    req.write(`data\n`);

    //finish the request
    req.end();

  });
}

const getBookingSeat = (bookingInfo, seat) => {
  const seatObj = JSON.parse(bookingInfo);
  const seatList = [].concat(...seatObj).filter(item => item.state === 0);
  const found = seatList.find(item => item.seat === +seat);
  return found ? +seat : seatList.length > 0 ? seatList[0].seat : -1;
}

const doBookingRequest = (cookie, bookingId, bookingSeat) => {

  return new Promise((resolve, reject) => {

    const options = {
      host: 'tguser.com',
      path: `/webtouch/api/usuarios/reservas/bookTouch/${bookingId}/iframe`,
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json',
      }
    };

    const data = {
      bookedSeat: bookingSeat,
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', (e) => {
      reject(e.message);
    });

    //do the request
    req.write(JSON.stringify(data));

    //finish the request
    req.end();

  });
}

module.exports.bookActivity = async event => {
  console.log("event", event);

  try {
    const {
      user,
      pass,
      offset,
      activityId,
      activityNumber,
      seat,
    } = event;

    console.log("user", user)

    const today = new Date();
    const bookingDate = today.addDays(+offset);
    const bookingDateStr = `${bookingDate.getFullYear()}-${bookingDate.getMonth() + 1}-${bookingDate.getDate()}`;
    const startDate = bookingDateStr;
    const endDate = bookingDateStr;
    console.log("Date", bookingDateStr);

    const { cookie } = await doLoginRequest(user, pass);
    console.log("Cookie", cookie);

    const schedules = await getSchedulesRequestByDates(cookie, startDate, endDate);
    const bookingId = getBookingIdByActivityId(activityId, +activityNumber, schedules);
    console.log("bookingId", bookingId);

    const bookingInfo = await getBookingInfoRequestById(cookie, bookingId);
    const bookingSeat = getBookingSeat(bookingInfo, seat);
    console.log("bookingSeat", bookingSeat);

    if (bookingSeat > 0) {
      await doBookingRequest(cookie, bookingId, bookingSeat);
      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: `bookActivity executed successfully activity ${activityId}, booking ${bookingId}, seat ${bookingSeat} at ${bookingDateStr}!`,
            input: event,
          },
          null,
          2
        ),
      };

    } else {
      return {
        statusCode: 500,
        body: JSON.stringify(
          {
            message: `No empty seats for activity ${activityId} at booking ${bookingId} at ${bookingDateStr}`,
            input: event,
          },
          null,
          2
        ),
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: 'bookActivity executed with errors',
          err,
          input: event,
        },
        null,
        2
      ),
    };
  }

};
