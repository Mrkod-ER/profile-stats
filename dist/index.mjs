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
import * as cheerio from "cheerio";
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
import * as cheerio2 from "cheerio";
var PLATFORM4 = "GeeksforGeeks";
var BASE_URL2 = "https://www.geeksforgeeks.org";
async function getGfG(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
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
async function getGfGRaw(username, options = {}) {
  const timeout = options.timeout ?? 1e4;
  try {
    const url = `${BASE_URL2}/user/${username}/`;
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
export {
  getAllStats,
  getCodeChef,
  getCodeChefRaw,
  getCodeforces,
  getCodeforcesRaw,
  getGfG,
  getGfGRaw,
  getLeetCode,
  getLeetCodeRaw
};
//# sourceMappingURL=index.mjs.map