import { NextResponse } from "next/server";

const generateFallbackData = () => {
  return Array.from({ length: 371 }, (_, idx) => {
    const rand = Math.random();
    let count = 0;
    if (rand > 0.85) count = Math.floor(Math.random() * 5) + 6;
    else if (rand > 0.60) count = Math.floor(Math.random() * 3) + 3;
    else if (rand > 0.35) count = Math.floor(Math.random() * 2) + 1;
    
    const d = new Date();
    d.setDate(d.getDate() - (371 - idx));
    return { count, date: d.toISOString().split("T")[0] };
  });
};

export async function GET() {
  const username = "puneet426";
  const token = process.env.GITHUB_PAT_TOKEN;

  let days = [];
  let totalContributions = 2541;

  if (!token) {
    console.warn("Using simulated fallback array parameters.");
    days = generateFallbackData();
  } else {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables: { username } }),
        next: { revalidate: 3600 },
      });

      const data = await response.json();
      if (data.errors || !data.data?.user) throw new Error("GraphQL Error");

      const calendar = data.data.user.contributionsCollection.contributionCalendar;
      totalContributions = calendar.totalContributions;
      days = calendar.weeks.flatMap((w: any) =>
        w.contributionDays.map((d: any) => ({
          count: d.contributionCount,
          date: d.date,
        }))
      );
    } catch (err) {
      days = generateFallbackData();
    }
  }

  // --- Calculate Analytics Real-Time ---
  let maxStreak = 0;
  let currentStreak = 0;
  let activeDaysCount = 0;
  let lastActiveDateStr = "No activity";

  days.forEach((day: any) => {
    if (day.count > 0) {
      currentStreak++;
      activeDaysCount++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      lastActiveDateStr = day.date; // Continuously moves forward to find latest
    } else {
      currentStreak = 0;
    }
  });

  // Calculate Consistency % (Active days out of total monitored days)
  const consistencyPercentage = Math.round((activeDaysCount / days.length) * 100);

  // Parse Last Active Date to readable text (e.g., "Jul 6")
  let formattedLastActive = "None";
  if (lastActiveDateStr !== "No activity") {
    const parsedDate = new Date(lastActiveDateStr);
    formattedLastActive = parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return NextResponse.json({
    totalContributions,
    bestStreak: `${maxStreak}d`,
    consistency: `${consistencyPercentage}%`,
    lastActive: formattedLastActive,
    days,
  });
}