"use server";

export async function submitContactForm(prevState: any, formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const subject = formData.get("subject")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  // Validate required inputs
  if (!name || !email || !message) {
    return { success: false, error: "Please fill all required fields." };
  }

  try {
    // 📨 Swap with your actual Formspree / Web3Forms dashboard key string!
    const formAccessKey = "YOUR_FORMSPREE_OR_WEB3FORMS_KEY"; 

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: formAccessKey,
        name,
        email,
        subject: subject || "New Contact Form Portfolio Query",
        message,
      }),
    });

    if (!response.ok) throw new Error("API Forwarding Failed");

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: "Something went wrong. Please try again later." };
  }
}