import { profile } from "@/lib/data";

export const metadata = { title: "Data Deletion" };

export default function DataDeletionPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 font-content leading-relaxed space-y-6">
      <h1 className="text-3xl font-semibold">Data Deletion Instructions</h1>
      <p>
        The @codewith.pt Instagram automation stores only your Instagram username, Instagram-scoped ID, your comment
        and the messages exchanged with @codewith.pt. Most of it is deleted automatically within 7 days.
      </p>
      <h2 className="text-xl font-semibold">To request deletion</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>
          Send an email to <a className="underline" href={`mailto:${profile.email}?subject=Data%20deletion%20request`}>{profile.email}</a>{" "}
          with the subject &ldquo;Data deletion request&rdquo;, or send a DM to @codewith.pt saying &ldquo;delete my data&rdquo;.
        </li>
        <li>Include your Instagram username.</li>
        <li>All data related to your account will be deleted within 30 days and you will get a confirmation.</li>
      </ol>
      <p>
        You can also remove the conversation from your own inbox at any time in the Instagram app. See the{" "}
        <a className="underline" href="/privacy">privacy policy</a> for details.
      </p>
    </article>
  );
}
