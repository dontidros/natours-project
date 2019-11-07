const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
///the real sending email operation
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Ori Tal <${process.env.EMAIL_FROM}>`
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      })
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }

      })
    }
  }

  async send(template, subject) {
    //send the actual email
    //1) render the HTML based on the pug template
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    //2) define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    }
    //3)create a transport and send email
    await this.newTransport().sendMail(mailOptions);

  }
  async sendWelcome() {
    await this.send('welcome', 'welcome to the Natours family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes)');
  }
}

//all this code is from earlier attempts

// const sendEmail = async options => {
//   //1. create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }

//   })
//   //2. define the email options
//   const mailOptions = {
//     from: 'Natours <natours@ori.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     //html:
//   }
//   //3. actually send the email
//   await transporter.sendMail(mailOptions)
// }

// module.exports = sendEmail;