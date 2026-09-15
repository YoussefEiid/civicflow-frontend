import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "baszmat3@gmail.com",
    pass: "hquozwytjyfvmoni",
  },
});

async function main() {
  try {
    console.log("1. Testing Gmail SMTP connection...");

    await transporter.verify();

    console.log("2. SMTP connection: SUCCESS");

    const info = await transporter.sendMail({
      from: '"CivicFlow" <baszmat3@gmail.com>',
      to: "youssefeid88888@gmail.com",
      subject: "CivicFlow - Test Email",
      text: "CivicFlow email test successful.",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>اختبار البريد الإلكتروني</h2>
          <p>إذا وصلت هذه الرسالة، فإن Gmail SMTP + Nodemailer يعملان بشكل صحيح.</p>
        </div>
      `,
    });

    console.log("3. Email sent successfully");
    console.log("Message ID:", info.messageId);
  } catch (error: any) {
    console.error("EMAIL TEST FAILED");
    console.error("Code:", error?.code);
    console.error("Response:", error?.response);
    console.error("Message:", error?.message);
  }
}

main();