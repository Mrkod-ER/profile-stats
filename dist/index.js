"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  getAllStats: () => getAllStats,
  getCodeChef: () => getCodeChef,
  getCodeChefRaw: () => getCodeChefRaw,
  getCodeforces: () => getCodeforces,
  getCodeforcesRaw: () => getCodeforcesRaw,
  getGfG: () => getGfG,
  getGfGRaw: () => getGfGRaw,
  getLeetCode: () => getLeetCode,
  getLeetCodeRaw: () => getLeetCodeRaw
});
module.exports = __toCommonJS(index_exports);

// src/utils/fetcher.ts
async function fetchWithTimeout(url, options = {}, timeout = 1e4) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
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
async function getCodeforces(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
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
    let contestsCount = 0;
    try {
      const ratingUrl = `${API_BASE}/user.rating?handle=${username}`;
      const ratingResponse = await fetchJSON(ratingUrl, timeout);
      if (ratingResponse.status === "OK") {
        contestsCount = ratingResponse.result.length;
      }
    } catch {
      contestsCount = 0;
    }
    const stats = {
      username: user.handle,
      rating: user.rating ?? 0,
      maxRating: user.maxRating ?? 0,
      rank: user.rank ?? "unrated",
      maxRank: user.maxRank ?? "unrated",
      solved: solvedProblems.size,
      contestsCount,
      contribution: user.contribution ?? 0,
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
async function getCodeforcesRaw(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
  try {
    const url = `${API_BASE}/user.info?handles=${username}`;
    const response = await fetchJSON(url, timeout);
    if (response.status !== "OK") {
      throw new UserNotFoundError(PLATFORM, username);
    }
    return { success: true, data: response };
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
async function getLeetCode(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
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
async function getLeetCodeRaw(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
  try {
    const query = {
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
    const response = await fetchWithTimeout(
      GRAPHQL_ENDPOINT,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query)
      },
      timeout
    );
    const data = await response.json();
    if (!data.data.matchedUser) {
      throw new UserNotFoundError(PLATFORM2, username);
    }
    return { success: true, data: data.data };
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
async function getCodeChef(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
  try {
    const url = `${BASE_URL}/users/${username}`;
    const html = await fetchHTML(url, timeout);
    const $ = cheerio.load(html);
    if ($('h1:contains("404")').length > 0 || $('title:contains("404")').length > 0) {
      throw new UserNotFoundError(PLATFORM3, username);
    }
    const ratingText = $(".rating-number").first().text().trim();
    const rating = parseInt(ratingText) || 0;
    const ratingHeader = $(".rating-header").text();
    const maxRatingMatch = ratingHeader.match(/Highest Rating\s*(\d+)/i);
    const maxRating = maxRatingMatch ? parseInt(maxRatingMatch[1]) : rating;
    const starsText = $(".rating-star").find("span").length;
    const stars = starsText || 0;
    const solvedHeader = $('h3:contains("Total Problems Solved")').text();
    const solvedMatch = solvedHeader.match(/Total Problems Solved:\s*(\d+)/i);
    const solved = solvedMatch ? parseInt(solvedMatch[1]) : 0;
    const contestsHeader = $('h3:contains("Contests")').text();
    const contestsMatch = contestsHeader.match(/Contests\s*\((\d+)\)/i);
    const contests = contestsMatch ? parseInt(contestsMatch[1]) : 0;
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
      contests,
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
async function getCodeChefRaw(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
  try {
    const url = `${BASE_URL}/users/${username}`;
    const html = await fetchHTML(url, timeout);
    if (html.includes("404") || html.includes("Page not found")) {
      throw new UserNotFoundError(PLATFORM3, username);
    }
    return { success: true, data: html };
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: new PlatformError(PLATFORM3, message).message };
  }
}

// src/platforms/gfg.ts
var PLATFORM4 = "GeeksforGeeks";
var BASE_URL2 = "https://www.geeksforgeeks.org";
async function getGfG(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
  try {
    const url = `${BASE_URL2}/profile/${username}`;
    const html = await fetchHTML(url, timeout);
    if (!html.match(/\\?"userData\\?":/)) {
      if (html.includes("404") || html.includes("User not found")) {
        throw new UserNotFoundError(PLATFORM4, username);
      }
      throw new PlatformError(PLATFORM4, "Failed to find user data in profile page");
    }
    const scoreMatch = html.match(/\\?"score\\?":\s*(\d+)/);
    const monthlyScoreMatch = html.match(/\\?"monthly_score\\?":\s*(\d+)/);
    const totalSolvedMatch = html.match(/\\?"total_problems_solved\\?":\s*(\d+)/);
    const instituteRankMatch = html.match(/\\?"institute_rank\\?":\s*(\d+)/);
    const avatarMatch = html.match(/\\?"profile_image_url\\?":\s*\\?"([^"\\]+)\\?"/);
    const maxStreakMatch = html.match(/\\?"pod_solved_global_longest_streak\\?":\s*(\d+)/);
    const currentStreakMatch = html.match(/\\?"pod_solved_current_streak\\?":\s*(\d+)/);
    const codingScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const monthlyScore = monthlyScoreMatch ? parseInt(monthlyScoreMatch[1]) : 0;
    const totalSolved = totalSolvedMatch ? parseInt(totalSolvedMatch[1]) : 0;
    const instituteRank = instituteRankMatch ? parseInt(instituteRankMatch[1]) : void 0;
    let avatarUrl = avatarMatch ? avatarMatch[1].replace(/\\/g, "") : "";
    const avatar = avatarUrl || `${BASE_URL2}/img/default-profile.png`;
    const maxStreak = maxStreakMatch ? parseInt(maxStreakMatch[1]) : 0;
    const currentStreak = currentStreakMatch ? parseInt(currentStreakMatch[1]) : 0;
    const stats = {
      username,
      codingScore,
      monthlyScore,
      solved: {
        total: totalSolved,
        easy: 0,
        // Not available in SSR HTML
        medium: 0,
        // Not available in SSR HTML
        hard: 0
        // Not available in SSR HTML
      },
      currentStreak,
      maxStreak,
      instituteRank,
      avatar
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
async function getGfGRaw(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
  try {
    const url = `${BASE_URL2}/profile/${username}`;
    const html = await fetchHTML(url, timeout);
    if (html.includes("404") || html.includes("User not found")) {
      throw new UserNotFoundError(PLATFORM4, username);
    }
    return { success: true, data: html };
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: new PlatformError(PLATFORM4, message).message };
  }
}

// src/index.ts
async function getAllStats(handles, options = {}) {
  const promises = [];
  if (handles.codeforces) {
    promises.push(
      getCodeforces(handles.codeforces, options).then((result) => [
        "codeforces",
        result
      ])
    );
  }
  if (handles.leetcode) {
    promises.push(
      getLeetCode(handles.leetcode, options).then((result) => [
        "leetcode",
        result
      ])
    );
  }
  if (handles.codechef) {
    promises.push(
      getCodeChef(handles.codechef, options).then((result) => [
        "codechef",
        result
      ])
    );
  }
  if (handles.gfg) {
    promises.push(
      getGfG(handles.gfg, options).then((result) => [
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllStats,
  getCodeChef,
  getCodeChefRaw,
  getCodeforces,
  getCodeforcesRaw,
  getGfG,
  getGfGRaw,
  getLeetCode,
  getLeetCodeRaw
});
//# sourceMappingURL=index.js.map