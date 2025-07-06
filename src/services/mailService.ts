import nodemailer from "nodemailer";

export interface EmailDataType {
  to: string;
  subject: string;
  html: string;
}

export const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const sendEmail = async ({to, subject,  html}: EmailDataType) => {
  try {
    await transporter.sendMail({
      from: `"Abida" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
