import './env.js'
import express from "express";
import axios from "axios";
import querystring from "querystring";
import cors from "cors";

const app = express();

// OAuth endpoints configuration
const oauthEndpoints = {
    gitee: {
        client_id: process.env.GITEE_CLIENT_ID,
        client_secret: process.env.GITEE_CLIENT_SECRET,
        redirect_uri: process.env.GITEE_REDIRECT_URI,
    },
    github: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
    },
};

// Token storage simulation (in-memory for this example)
let accessToken = "";
let refreshToken = null;
let accessTokenExpiry = null;

// 使用 CORS 中间件
app.use(cors());
app.use(express.json());
// 中间件：检查 accessToken 是否过期
app.use(async (req, res, next) => {
    const pathData = [
        "/redirect",
        "/oauth/giteeAuthorize",
        "/oauth/giteeRedirectUri",
        "/oauth/githubAuthorize",
        "/oauth/githubRedirectUri",
    ];
    // 排除不需要访问令牌的路由
    if (pathData.includes(req.path)) {
        return next();
    }

    // 判断是 GitHub 还是 Gitee 授权
    const isGitHubAuth = req.query.type === "github";
    if (!accessToken || Date.now() >= accessTokenExpiry) {
        if (isGitHubAuth) {
            console.log("GitHub access token expired");
            // 返回 JSON 对象指示 token 已过期
            res.status(500).json({
                error: "访问令牌已过期",
                message: "请重新登录",
            });
        } else {
            console.log("Gitee access token expired");

            // 如果 accessToken 不存在或者已过期，则刷新 accessToken
            if (refreshToken) {
                try {
                    const tokenResponse = await axios.post(
                        "https://gitee.com/oauth/token",
                        querystring.stringify({
                            client_id: oauthEndpoints.gitee.client_id,
                            client_secret: oauthEndpoints.gitee.client_secret,
                            refresh_token: refreshToken,
                            grant_type: "refresh_token",
                        }),
                        {
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                        }
                    );
                    updateTokens(tokenResponse.data);
                    next();
                } catch (error) {
                    res.status(500).send({ code: 500, error: "刷新访问令牌失败" });
                }
            } else {
                res.status(401).send({ code: 401, error: "令牌已失效,请重新登录" });
            }
        }
    } else {
        // accessToken 未过期，继续处理请求
        next();
    }
});

// Middleware to check for access token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token === accessToken) {
        next();
    } else {
        res
            .status(500)
            .json({ code: 500, error: "获取的访问令牌不正确,无法获取用户信息" });
    }
};

function isGit(str) {
    const isGitee = str.includes("gitee");
    const isGitHub = str.includes("github");
    return {
        isGitee,
        isGitHub,
    };
}
// Helper functions

async function updateTokens(tokenResponse, isGitee) {
    // Simulated token update, in practice you would persist these securely.
    accessToken = tokenResponse.access_token;
    accessTokenExpiry = isGitee
        ? Date.now() + tokenResponse.expires_in * 1000
        : Date.now() + 3600 * 1000;
    if (isGitee && !refreshToken) {
        refreshToken = tokenResponse.refresh_token;
    }
}

function redirectToOAuth(req, res) {
    const platform = req.query.type;
    if (platform === "gitee") {
        res.redirect(`http://localhost:7001/oauth/giteeAuthorize`);
    } else if (platform === "github") {
        res.redirect(`http://localhost:7001/oauth/githubAuthorize`);
    } else {
        res.status(400).send({ code: 400, error: "指定的平台无效" });
    }
}

async function sendOAuthAuthorization(req, res) {
    const { isGitee, isGitHub } = isGit(req.originalUrl);
    const platform = isGitee ? "gitee" : isGitHub ? "github" : null;
    const endpoint = oauthEndpoints[platform];
    if (!endpoint) {
        res.status(404).send({ code: 404, error: "不支持平台" });
        return;
    }
    let header = null;
    if (isGitee) {
        header = `https://${platform}.com/`;
    }
    if (isGitHub) {
        header = `https://${platform}.com/login/`;
    }

    const url = `${header}oauth/authorize?client_id=${endpoint.client_id}&redirect_uri=${endpoint.redirect_uri}&response_type=code`;

    res.send(url);
}

async function handleOAuthRedirect(req, res) {
    const { isGitee, isGitHub } = isGit(req.url);
    const platform = isGitee ? "gitee" : isGitHub ? "github" : null;
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
        res.redirect(`http://localhost:6788/error?error=${error}`);
        return;
    }

    try {
        const endpoint = oauthEndpoints[platform];
        const url = isGitee
            ? `https://gitee.com/oauth/token`
            : `https://github.com/login/oauth/access_token`;
        const tokenResponse = await axios.post(
            url,
            querystring.stringify({
                client_id: endpoint.client_id,
                client_secret: endpoint.client_secret,
                code,
                grant_type: "authorization_code",
                redirect_uri: endpoint.redirect_uri,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json", // GitHub API 返回 JSON
                },
            }
        );

        updateTokens(tokenResponse.data, isGitee);
        res.redirect(`http://localhost:6788/success?code=${accessToken}`);
    } catch (error) {
        res.redirect(`http://localhost:6788/error?error=${error.message}`);
    }
}

async function getUserFromGitee(req, res) {
    try {
        const userData = await axios.get("https://gitee.com/api/v5/user", {
            params: { access_token: accessToken },
        });
        res.send({ code: 200, data: userData.data });
    } catch (error) {
        res.status(500).json({ code: 500, error: "无法从 Gitee 获取用户信息,请登录Gitee" });
    }
}

async function getUserFromGitHub(req, res) {
    try {
        const userData = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `token ${accessToken}`
            },
        });
        res.send({ code: 200, data: userData.data });
    } catch (error) {
        res.status(500).json({ code: 500, error: "无法从 GitHub 获取用户信息,请登录GitHub" });
    }
}

function protectedRoute(req, res) {
    res.send("这是受保护的资源");
}

// Routes
app.get("/redirect", redirectToOAuth);
app.get("/oauth/giteeAuthorize", sendOAuthAuthorization);
app.get("/oauth/githubAuthorize", sendOAuthAuthorization);
app.get("/oauth/giteeRedirectUri", handleOAuthRedirect);
app.get("/oauth/githubRedirectUri", handleOAuthRedirect);
app.get("/user/gitee", authenticateToken, getUserFromGitee);
app.get("/user/github", authenticateToken, getUserFromGitHub);
app.get("/protected", authenticateToken, protectedRoute);

const PORT = process.env.PORT || 7001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
