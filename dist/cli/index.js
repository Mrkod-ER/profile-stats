#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli/index.ts
var import_commander = require("commander");
var import_cli_table3 = __toESM(require("cli-table3"));

// src/utils/fetcher.ts
async function fetchWithTimeout(url, options2 = {}, timeout = 1e4) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options2,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
async function fetchJSON(url, timeout = 1e4) {
  const response = await fetchWithTimeout(url, {}, timeout);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}
async function fetchHTML(url, timeout = 1e4) {
  const response = await fetchWithTimeout(url, {}, timeout);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

// src/utils/errors.ts
var PlatformError = class extends Error {
  constructor(platform, message) {
    super(`[${platform}] ${message}`);
    this.platform = platform;
    this.name = "PlatformError";
  }
};
var UserNotFoundError = class extends Error {
  constructor(platform, username) {
    super(`[${platform}] User "${username}" not found`);
    this.platform = platform;
    this.username = username;
    this.name = "UserNotFoundError";
  }
};

// src/platforms/codeforces.ts
var PLATFORM = "Codeforces";
var API_BASE = "https://codeforces.com/api";
async function getCodeforces(username, options2 = {}) {
  const timeout = options2.timeout ?? 1e4;
  try {
    const userUrl = `${API_BASE}/user.info?handles=${username}`;
    const userResponse = await fetchJSON(userUrl, timeout);
    if (userResponse.status !== "OK" || !userResponse.result.length) {
      throw new UserNotFoundError(PLATFORM, username);
    }
    const user = userResponse.result[0];
    const submissionsUrl = `${API_BASE}/user.status?handle=${username}`;
    const submissionsResponse = await fetchJSON(
      submissionsUrl,
      timeout
    );
    const solvedProblems = /* @__PURE__ */ new Set();
    if (submissionsResponse.status === "OK") {
      submissionsResponse.result.forEach((submission) => {
        if (submission.verdict === "OK") {
          const problemId = `${submission.problem.contestId}-${submission.problem.index}`;
          solvedProblems.add(problemId);
        }
      });
    }
    const stats = {
      username: user.handle,
      rating: user.rating ?? 0,
      maxRating: user.maxRating ?? 0,
      rank: user.rank ?? "unrated",
      maxRank: user.maxRank ?? "unrated",
      solved: solvedProblems.size,
      avatar: user.avatar.startsWith("//") ? `https:${user.avatar}` : user.avatar
    };
    return { success: true, data: stats };
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: new PlatformError(PLATFORM, message).message };
  }
}

// src/platforms/leetcode.ts
var PLATFORM2 = "LeetCode";
var GRAPHQL_ENDPOINT = "https://leetcode.com/graphql/";
async function getLeetCode(username, options2 = {}) {
  const timeout = options2.timeout ?? 1e4;
  try {
    const profileQuery = {
      query: `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              userAvatar
              ranking
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
      variables: { username }
    };
    const profileResponse = await fetchWithTimeout(
      GRAPHQL_ENDPOINT,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileQuery)
      },
      timeout
    );
    if (!profileResponse.ok) {
      throw new Error(`HTTP ${profileResponse.status}`);
    }
    const profileData = await profileResponse.json();
    if (!profileData.data.matchedUser) {
      throw new UserNotFoundError(PLATFORM2, username);
    }
    const user = profileData.data.matchedUser;
    const contestQuery = {
      query: `
        query userContestRankingInfo($username: String!) {
          userContestRanking(username: $username) {
            rating
            globalRanking
            attendedContestsCount
          }
        }
      `,
      variables: { username }
    };
    const contestResponse = await fetchWithTimeout(
      GRAPHQL_ENDPOINT,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contestQuery)
      },
      timeout
    );
    const contestData = await contestResponse.json();
    const solvedMap = {};
    user.submitStats.acSubmissionNum.forEach((item) => {
      solvedMap[item.difficulty] = item.count;
    });
    const stats = {
      username: user.username,
      ranking: user.profile.ranking,
      solved: {
        total: solvedMap["All"] ?? 0,
        easy: solvedMap["Easy"] ?? 0,
        medium: solvedMap["Medium"] ?? 0,
        hard: solvedMap["Hard"] ?? 0
      },
      contestRating: contestData.data.userContestRanking?.rating,
      contestRanking: contestData.data.userContestRanking?.globalRanking,
      contestsAttended: contestData.data.userContestRanking?.attendedContestsCount,
      avatar: user.profile.userAvatar
    };
    return { success: true, data: stats };
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: new PlatformError(PLATFORM2, message).message };
  }
}

// src/platforms/codechef.ts
var cheerio = __toESM(require("cheerio"));
var PLATFORM3 = "CodeChef";
var BASE_URL = "https://www.codechef.com";
async function getCodeChef(username, options2 = {}) {
  const timeout = options2.timeout ?? 1e4;
  try {
    const url = `${BASE_URL}/users/${username}`;
    const html = await fetchHTML(url, timeout);
    const $ = cheerio.load(html);
    if ($('h1:contains("404")').length > 0 || $('title:contains("404")').length > 0) {
      throw new UserNotFoundError(PLATFORM3, username);
    }
    const ratingText = $(".rating-number").first().text().trim();
    const rating = parseInt(ratingText) || 0;
    const maxRatingText = $(".rating-header .small").text();
    const maxRatingMatch = maxRatingText.match(/Highest Rating (\d+)/);
    const maxRating = maxRatingMatch ? parseInt(maxRatingMatch[1]) : rating;
    const starsText = $(".rating-star").find("span").length;
    const stars = starsText || 0;
    const solvedText = $("section.rating-data-section.problems-solved h3").text().trim();
    const solved = parseInt(solvedText) || 0;
    const globalRankText = $(".rating-ranks ul li").first().find(".rank").text().trim();
    const globalRank = parseInt(globalRankText.replace(/,/g, "")) || void 0;
    const countryRankText = $(".rating-ranks ul li").eq(1).find(".rank").text().trim();
    const countryRank = parseInt(countryRankText.replace(/,/g, "")) || void 0;
    const avatarSrc = $(".user-profile-photo img").attr("src") || "";
    const avatar = avatarSrc.startsWith("//") ? `https:${avatarSrc}` : avatarSrc;
    const stats = {
      username,
      rating,
      maxRating,
      stars,
      solved,
      globalRank,
      countryRank,
      avatar: avatar || `${BASE_URL}/misc/default-profile-image.png`
    };
    return { success: true, data: stats };
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: new PlatformError(PLATFORM3, message).message };
  }
}

// src/platforms/gfg.ts
var cheerio2 = __toESM(require("cheerio"));
var PLATFORM4 = "GeeksforGeeks";
var BASE_URL2 = "https://www.geeksforgeeks.org";
async function getGfG(username, options2 = {}) {
  const timeout = options2.timeout ?? 1e4;
  try {
    const url = `${BASE_URL2}/user/${username}/`;
    const html = await fetchHTML(url, timeout);
    const $ = cheerio2.load(html);
    if ($('h1:contains("404")').length > 0 || html.includes("User not found")) {
      throw new UserNotFoundError(PLATFORM4, username);
    }
    const scoreText = $(".score_card_value").first().text().trim();
    const codingScore = parseInt(scoreText) || 0;
    const currentStreakText = $(".streak_count").first().text().trim();
    const currentStreak = parseInt(currentStreakText) || 0;
    const maxStreakText = $(".max_streak").text().trim() || currentStreakText;
    const maxStreak = parseInt(maxStreakText) || currentStreak;
    const problemStats = $(".problems_solved .problems_solved_section");
    let totalSolved = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;
    problemStats.each((_, elem) => {
      const label = $(elem).find(".difficulty_label").text().toLowerCase();
      const count = parseInt($(elem).find(".solved_count").text().trim()) || 0;
      if (label.includes("easy")) easy = count;
      else if (label.includes("medium")) medium = count;
      else if (label.includes("hard")) hard = count;
      totalSolved += count;
    });
    const instituteRankText = $(".institute_rank_value").text().trim();
    const instituteRank = instituteRankText ? parseInt(instituteRankText) : void 0;
    const avatarSrc = $(".profile_pic img").attr("src") || "";
    const avatar = avatarSrc.startsWith("//") ? `https:${avatarSrc}` : avatarSrc.startsWith("/") ? `${BASE_URL2}${avatarSrc}` : avatarSrc;
    const stats = {
      username,
      codingScore,
      solved: {
        total: totalSolved,
        easy,
        medium,
        hard
      },
      currentStreak,
      maxStreak,
      instituteRank,
      avatar: avatar || `${BASE_URL2}/img/default-profile.png`
    };
    return { success: true, data: stats };
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: new PlatformError(PLATFORM4, message).message };
  }
}

// src/index.ts
async function getAllStats(handles2, options2 = {}) {
  const promises = [];
  if (handles2.codeforces) {
    promises.push(
      getCodeforces(handles2.codeforces, options2).then((result) => [
        "codeforces",
        result
      ])
    );
  }
  if (handles2.leetcode) {
    promises.push(
      getLeetCode(handles2.leetcode, options2).then((result) => [
        "leetcode",
        result
      ])
    );
  }
  if (handles2.codechef) {
    promises.push(
      getCodeChef(handles2.codechef, options2).then((result) => [
        "codechef",
        result
      ])
    );
  }
  if (handles2.gfg) {
    promises.push(
      getGfG(handles2.gfg, options2).then((result) => [
        "gfg",
        result
      ])
    );
  }
  const results = await Promise.all(promises);
  const stats = {};
  results.forEach(([platform, result]) => {
    stats[platform] = result;
  });
  return stats;
}

// src/cli/index.ts
var program = new import_commander.Command();
program.name("cpstat").description("Fetch competitive programming stats from multiple platforms").version("0.1.0").option("--cf <username>", "Codeforces username").option("--lc <username>", "LeetCode username").option("--cc <username>", "CodeChef username").option("--gfg <username>", "GeeksforGeeks username").option("--timeout <ms>", "Request timeout in milliseconds", "10000").parse(process.argv);
var options = program.opts();
var handles = {
  codeforces: options.cf,
  leetcode: options.lc,
  codechef: options.cc,
  gfg: options.gfg
};
if (!handles.codeforces && !handles.leetcode && !handles.codechef && !handles.gfg) {
  console.error("Error: Please specify at least one platform username");
  console.log("Example: cpstat --cf tourist --lc neal_wu");
  process.exit(1);
}
async function main() {
  console.log("Fetching stats...\n");
  const stats = await getAllStats(handles, {
    timeout: parseInt(options.timeout)
  });
  const table = new import_cli_table3.default({
    head: ["Platform", "Username", "Rating/Score", "Solved", "Status"],
    colWidths: [15, 20, 15, 15, 20]
  });
  if (stats.codeforces) {
    if (stats.codeforces.success) {
      const data = stats.codeforces.data;
      table.push([
        "Codeforces",
        data.username,
        `${data.rating} (max: ${data.maxRating})`,
        data.solved.toString(),
        `\u2713 ${data.rank}`
      ]);
    } else {
      table.push(["Codeforces", handles.codeforces || "", "-", "-", `\u2717 ${stats.codeforces.error}`]);
    }
  }
  if (stats.leetcode) {
    if (stats.leetcode.success) {
      const data = stats.leetcode.data;
      table.push([
        "LeetCode",
        data.username,
        data.contestRating ? data.contestRating.toFixed(0) : "N/A",
        `${data.solved.total} (E:${data.solved.easy} M:${data.solved.medium} H:${data.solved.hard})`,
        `\u2713 Rank #${data.ranking}`
      ]);
    } else {
      table.push(["LeetCode", handles.leetcode || "", "-", "-", `\u2717 ${stats.leetcode.error}`]);
    }
  }
  if (stats.codechef) {
    if (stats.codechef.success) {
      const data = stats.codechef.data;
      table.push([
        "CodeChef",
        data.username,
        `${data.rating} (${data.stars}\u2605)`,
        data.solved.toString(),
        `\u2713 Global #${data.globalRank || "N/A"}`
      ]);
    } else {
      table.push(["CodeChef", handles.codechef || "", "-", "-", `\u2717 ${stats.codechef.error}`]);
    }
  }
  if (stats.gfg) {
    if (stats.gfg.success) {
      const data = stats.gfg.data;
      table.push([
        "GeeksforGeeks",
        data.username,
        `Score: ${data.codingScore}`,
        `${data.solved.total} (E:${data.solved.easy} M:${data.solved.medium} H:${data.solved.hard})`,
        `\u2713 Streak: ${data.currentStreak}`
      ]);
    } else {
      table.push(["GeeksforGeeks", handles.gfg || "", "-", "-", `\u2717 ${stats.gfg.error}`]);
    }
  }
  console.log(table.toString());
}
main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
//# sourceMappingURL=index.js.map