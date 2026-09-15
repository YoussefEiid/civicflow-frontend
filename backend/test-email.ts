import { sendOTPEmail } from "./src/services/email.service.js";

async function main() {
  console.log("Testing sendOTPEmail with EmailJS integration...");
  const result = await sendOTPEmail({
    email: "youssefeid8888@gmail.com",
    otp: "593812",
    purpose: "verify_email",
    userName: "يوسف عيد",
    expiresInMinutes: 5,
  });
  console.log("SEND RESULT:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Test failed:", err);
});