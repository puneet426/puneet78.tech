"use server";

export async function submitContactForm(prevState: any, formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const subject = formData.get("subject")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    return { success: false, error: "Please fill all required fields." };
  }

  try {
    const formAccessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY; 

    if (!formAccessKey) {
      return { success: false, error: "Configuration Error: Access key is missing." };
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: formAccessKey,
        name,
        email,
        subject: subject || `New Portfolio Query from ${name}`,
        message,
        from_name: "Portfolio Contact Form",
      }),
    });

    // 🚀 FIX: Read as raw text first to avoid breaking JSON token crashes
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Web3Forms returned non-JSON response HTML body:", responseText);
      return { 
        success: false, 
        error: "The submission server returned an unexpected error page. Please check your key configuration." 
      };
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "API Forwarding Failed");
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Contact Form Submission Error:", error);
    return { success: false, error: error.message || "Something went wrong. Please try again later." };
  }
}