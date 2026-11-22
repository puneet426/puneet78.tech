import { profile } from "@/lib/data";

export const metadata = { title: "Privacy Policy" };

const UPDATED = "22 November 2026";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 font-content leading-relaxed space-y-6">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-neutral-500">Last updated: {UPDATED}</p>

      <p>
        This policy covers this website and the Instagram messaging automation run by {profile.name} for the
        Instagram account <strong>@codewith.pt</strong> (Meta app &ldquo;codewithpt-automation&rdquo;).
      </p>

      <h2 className="text-xl font-semibold">What the automation does</h2>
      <p>
        When you comment on a @codewith.pt Reel, the automation may reply to your comment and send you a direct
        message with the resource mentioned in the Reel (for example a link to notes or a blog post). If you tap a
        button in that message, it may check whether you follow @codewith.pt before sending the resource.
      </p>

      <h2 className="text-xl font-semibold">Data we receive from Instagram</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Your Instagram username and Instagram-scoped user ID</li>
        <li>The text and ID of your comment, and the Reel it was posted on</li>
        <li>Messages and button taps you send to @codewith.pt in that conversation</li>
        <li>Whether you follow @codewith.pt (yes/no only)</li>
      </ul>

      <h2 className="text-xl font-semibold">How we use it</h2>
      <p>
        Only to reply to your comment, send you the message you asked for, and show the account owner simple
        statistics (how many comments, messages and deliveries happened). We do not sell, rent or share this data,
        use it for advertising, or combine it with other data.
      </p>

      <h2 className="text-xl font-semibold">Storage and retention</h2>
      <p>
        Data is stored in a private database hosted by Upstash (Redis) and the site is hosted on Vercel. Conversation
        state expires automatically after 7 days. The activity log keeps only the most recent 300 events, so older
        entries are deleted automatically.
      </p>

      <h2 className="text-xl font-semibold">Your choices</h2>
      <p>
        You can stop receiving messages at any time by not replying or by blocking/restricting @codewith.pt. To ask
        for your data to be deleted, follow the steps on the{" "}
        <a className="underline" href="/data-deletion">data deletion page</a>.
      </p>

      <h2 className="text-xl font-semibold">Contact</h2>
      <p>
        {profile.name} — <a className="underline" href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
    </article>
  );
}
