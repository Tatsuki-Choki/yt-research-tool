"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Settings2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Globe, 
  MessageSquare,
  Menu,
  X,
  Filter,
  ChevronDown,
  Eye,
  Users,
  ThumbsUp,
  BookOpen
} from 'lucide-react';

// --- デザインガイド2.1 & 2.2準拠のカラートークン ---
const COLORS = {
  bg: "#FFFFFF",
  textStrong: "#0F0F0F",  // 主要テキスト（見出し等）
  text: "#212121",         // 通常テキスト  
  muted: "#606060",        // 補助テキスト
  line: "#E5E5E5",         // 境界線
  accent: "#FF0000",       // YouTube Red（プライマリアクション限定）
  accentPress: "#CC0000",  // ホバー時
  focus: "#1A73E8",        // フォーカス
};

// --- スペーシング（8の倍数グリッド） ---
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,  // カード・テーブルの外枠パディング
  xl: 32,
  xxl: 40,
};

// --- コンポーネント設定 ---
const COMPONENT = {
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
};

// --- 型定義 ---
interface VideoRow {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount?: number;
  thumbnailUrl: string;
  videoUrl: string;
  channelUrl: string;
  subscriberCount?: number;
  hiddenSubscriberCount?: boolean;
  country?: string;
  matchedRule: "3x" | "2x" | "1x" | "minViews" | "none";
  isShort?: boolean;
}

interface CommentRow {
  videoId: string;
  commentId: string;
  parentId?: string | null;
  authorDisplayName: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  updatedAt?: string;
}

const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: "", label: "指定なし" },
  { code: "JP", label: "日本" },
  { code: "US", label: "アメリカ" },
  { code: "IN", label: "インド" },
  { code: "GB", label: "イギリス" },
  { code: "DE", label: "ドイツ" },
  { code: "FR", label: "フランス" },
  { code: "BR", label: "ブラジル" },
  { code: "KR", label: "韓国" },
];

type PeriodKey = "10y" | "5y" | "3y" | "2y" | "1y" | "6m";
type ShortsMode = "exclude" | "include" | "only";
type RatioThreshold = 1 | 2 | 3;

// --- ユーティリティ ---
const storeKey = (k: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem("yt_api_key", k);
  }
};
const loadKey = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("yt_api_key") || "";
  }
  return "";
};

function calcPublishedAfter(period: PeriodKey) {
  const d = new Date();
  if (period === "6m") d.setMonth(d.getMonth() - 6);
  else if (period === "1y") d.setFullYear(d.getFullYear() - 1);
  else if (period === "2y") d.setFullYear(d.getFullYear() - 2);
  else if (period === "3y") d.setFullYear(d.getFullYear() - 3);
  else if (period === "5y") d.setFullYear(d.getFullYear() - 5);
  else d.setFullYear(d.getFullYear() - 10);
  return d.toISOString();
}

// ISO8601期間(PT#H#M#S) → 秒
function durationToSeconds(iso?: string): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return undefined;
  const h = Number(m[1] || 0);
  const mi = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h * 3600 + mi * 60 + s;
}

function numberFormat(n?: number) {
  if (typeof n !== "number") return "-";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// CSV生成（テスト可能な純関数）
function buildCSV(
  headers: string[],
  rows: unknown[],
  selector: (row: unknown, key: string) => unknown
): string {
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };
  return [headers.map((h) => `"${h}"`).join(",")]
    .concat(rows.map((r) => headers.map((key) => escape(selector(r, key))).join(",")))
    .join("\n");
}

function downloadCSV(filename: string, rows: unknown[], headers: string[], selector: (row: unknown, key: string) => unknown) {
  const csv = buildCSV(headers, rows, selector);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function testApiKey(key: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/i18nLanguages?part=snippet&key=${encodeURIComponent(key)}&maxResults=1`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, reason: body?.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Network error" };
  }
}

// Shorts 判定の強化（60秒以下 もしくは #shorts タグ/ハッシュ）
interface VideoData {
  contentDetails?: { duration?: string };
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    channelId?: string;
  };
}

function isShortByHeuristic(v: VideoData): boolean {
  const durationSec = durationToSeconds(v?.contentDetails?.duration);
  const shortByTime = typeof durationSec === "number" && durationSec <= 61;
  const title = (v?.snippet?.title || "") as string;
  const description = (v?.snippet?.description || "") as string;
  const tags: string[] = Array.isArray(v?.snippet?.tags) ? (v.snippet.tags as string[]) : [];
  const hasHashShorts = /#shorts/i.test(title) || /#shorts/i.test(description) || tags.some((t) => /shorts/i.test(t));
  return shortByTime || hasHashShorts;
}

// 比率しきい値の判定
function qualifiesByRatio(viewCount: number, subscriberCount: number | undefined, hidden: boolean, multiple: RatioThreshold): boolean {
  if (hidden) return false;
  if (typeof subscriberCount !== "number") return false;
  return viewCount >= multiple * subscriberCount;
}

// --- メインコンポーネント ---
export default function Home() {
  const [apiKey, setApiKey] = useState<string>("");
  const [keyVerified, setKeyVerified] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string>("");
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [query, setQuery] = useState<string>("");
  const [minViews, setMinViews] = useState<string>("10000");
  const [country, setCountry] = useState<string>("");
  const [relevanceLanguage, setRelevanceLanguage] = useState<string>("ja");
  // 最大取得件数（検索ページを跨いで収集）
  const [maxTotal, setMaxTotal] = useState<number>(500);
  const [includeHidden, setIncludeHidden] = useState<boolean>(false);
  const [period, setPeriod] = useState<PeriodKey>("3y");
  const [shortsMode, setShortsMode] = useState<ShortsMode>("exclude");
  const [ratioThreshold, setRatioThreshold] = useState<RatioThreshold>(3);
  // 表示/検索の並び順
  const [displayOrder, setDisplayOrder] = useState<"viewCount" | "date" | "relevance">("viewCount");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [quotaEstimate, setQuotaEstimate] = useState<number>(0);

  const [commentsLoadingFor, setCommentsLoadingFor] = useState<string | null>(null);
  const [commentsByVideo, setCommentsByVideo] = useState<Record<string, CommentRow[]>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [testReport, setTestReport] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  // 実行制御
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  const [isCancelling, setIsCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(0); // 0で無効

  // --- 小さなUIコンポーネント（セグメント/チップ） ---
  const Segments = ({
    value,
    options,
    onChange,
  }: {
    value: string;
    options: { label: string; value: string }[];
    onChange: (v: string) => void;
  }) => (
    <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: COLORS.line }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1.5 text-xs sm:text-sm ${active ? 'bg-red-50 text-red-600' : 'bg-white text-neutral-700'} border-r last:border-r-0`}
            style={{ borderColor: COLORS.line }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const Chips = ({
    value,
    options,
    onChange,
  }: {
    value: number;
    options: number[];
    onChange: (v: number) => void;
  }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 rounded-full text-xs border ${active ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-neutral-700'}`}
            style={{ borderColor: COLORS.line }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  const ActiveFilters = () => {
    const chips: { label: string; onRemove?: () => void }[] = [];
    if (displayOrder !== 'viewCount') chips.push({ label: `並び順:${displayOrder==='date'?'公開日':'関連度'}`, onRemove: () => setDisplayOrder('viewCount') });
    if (maxTotal !== 500) chips.push({ label: `最大:${maxTotal}`, onRemove: () => setMaxTotal(500) });
    if (period !== '3y') chips.push({ label: `期間:${period}` , onRemove: () => setPeriod('3y')});
    if (shortsMode !== 'exclude') chips.push({ label: `ショート:${shortsMode==='include'?'含む':'のみ'}`, onRemove: () => setShortsMode('exclude') });
    if (country) chips.push({ label: `国:${country}`, onRemove: () => setCountry("") });
    if (relevanceLanguage) chips.push({ label: `言語:${relevanceLanguage}`, onRemove: () => setRelevanceLanguage('') });
    if (ratioThreshold !== 3) chips.push({ label: `登録者比:${ratioThreshold}x`, onRemove: () => setRatioThreshold(3) });
    if (includeHidden) chips.push({ label: '非公開含む', onRemove: () => setIncludeHidden(false) });
    if (targetCount > 0) chips.push({ label: `停止:${targetCount}`, onRemove: () => setTargetCount(0) });
    if (Number(minViews) !== 10000) chips.push({ label: `最低再生:${minViews}`, onRemove: () => setMinViews('10000') });
    if (!chips.length) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {chips.map((c, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-white" style={{ borderColor: COLORS.line }}>
            {c.label}
            {c.onRemove && (
              <button onClick={c.onRemove} className="text-neutral-500 hover:text-neutral-700">×</button>
            )}
          </span>
        ))}
      </div>
    );
  };
  
  useEffect(() => {
    setMounted(true);
    const k = loadKey();
    if (k) setApiKey(k);
    runSelfTests();
  }, []);

  const onSaveKey = async () => {
    setVerifying(true);
    setVerifyError("");
    const result = await testApiKey(apiKey.trim());
    setVerifying(false);
    if (result.ok) {
      storeKey(apiKey.trim());
      setKeyVerified(true);
      setShowApiKeyModal(false);
    } else {
      setKeyVerified(false);
      setVerifyError(result.reason || "");
    }
  };

  const publishedAfter = useMemo(() => calcPublishedAfter(period), [period]);

  // 配列をチャンク分割
  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  async function runSearch() {
    setLoading(true);
    setError("");
    setVideos([]);
    setSelected({});
    setExpandedComments({});
    setScannedCount(0);
    setFilteredCount(0);
    setProgress(0);
    setIsCancelling(false);
    try {
      const q = query.trim() || "薄毛 対策 シャンプー";
      if (!apiKey) throw new Error("APIキーを入力してください。");
      // Abort/制御セットアップ
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      // ストリーミング処理（ページ単位で増分更新）
      const orderIndex: Record<string, number> = {};
      const seenIds = new Set<string>();
      const channelCache: Record<string, any> = {};
      const accum: VideoRow[] = [];
      let pageToken: string | undefined = undefined;
      let searchRequests = 0;
      let videoRequests = 0;
      let channelRequests = 0;
      do {
        while (isPausedRef.current) await new Promise((r) => setTimeout(r, 150));
        if (isCancelling) { abortRef.current?.abort(); break; }
        const perPage = Math.min(50, Math.max(0, maxTotal - seenIds.size));
        if (perPage <= 0) break;
        const searchParams = new URLSearchParams({
          key: apiKey,
          part: "snippet",
          type: "video",
          maxResults: String(perPage),
          q,
          publishedAfter,
          order: displayOrder === "viewCount" ? "viewCount" : displayOrder === "date" ? "date" : "relevance",
        });
        if (country) searchParams.set("regionCode", country.toUpperCase());
        if (relevanceLanguage) searchParams.set("relevanceLanguage", relevanceLanguage);
        if (publishedBefore) searchParams.set("publishedBefore", publishedBefore);
        if (pageToken) searchParams.set("pageToken", pageToken);
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`;
        const sres = await fetch(searchUrl, { signal });
        if (!sres.ok) {
          const body = await sres.json().catch(() => ({}));
          throw new Error(body?.error?.message || `search.list HTTP ${sres.status}`);
        }
        const sjson = await sres.json();
        const items: any[] = sjson.items || [];
        const newIds: string[] = [];
        for (const it of items) {
          const vid = it?.id?.videoId;
          if (vid && !seenIds.has(vid)) {
            seenIds.add(vid);
            newIds.push(vid);
            if (orderIndex[vid] === undefined) orderIndex[vid] = Object.keys(orderIndex).length;
          }
        }
        searchRequests += 1;
        setScannedCount(seenIds.size);
        setProgress(Math.min(100, Math.round((seenIds.size / Math.max(1, maxTotal)) * 100)));

        if (newIds.length > 0) {
          const vparams = new URLSearchParams({
            key: apiKey,
            part: "snippet,statistics,contentDetails",
            id: newIds.join(","),
            maxResults: String(newIds.length),
          });
          const vurl = `https://www.googleapis.com/youtube/v3/videos?${vparams.toString()}`;
          const vres = await fetch(vurl, { signal });
          if (!vres.ok) {
            const body = await vres.json().catch(() => ({}));
            throw new Error(body?.error?.message || `videos.list HTTP ${vres.status}`);
          }
          const vjson = await vres.json();
          const vitems: any[] = vjson.items || [];
          videoRequests += 1;

          const needChannels = Array.from(new Set(vitems.map((v: any) => v?.snippet?.channelId).filter(Boolean)))
            .filter((cid) => !channelCache[cid]);
          if (needChannels.length > 0) {
            const cparams = new URLSearchParams({
              key: apiKey,
              part: "snippet,statistics",
              id: needChannels.join(","),
              maxResults: String(needChannels.length),
            });
            const curl = `https://www.googleapis.com/youtube/v3/channels?${cparams.toString()}`;
            const cres = await fetch(curl, { signal });
            if (!cres.ok) {
              const body = await cres.json().catch(() => ({}));
              throw new Error(body?.error?.message || `channels.list HTTP ${cres.status}`);
            }
            const cjson = await cres.json();
            for (const c of cjson.items || []) channelCache[c.id] = c;
            channelRequests += 1;
          }

          const minViewsNum = Number(minViews || 0);
          const pageRows: VideoRow[] = vitems
            .map((video: any) => {
              const ch = channelCache[video?.snippet?.channelId as string];
              const subCount = ch?.statistics?.subscriberCount ? Number(ch.statistics.subscriberCount) : undefined;
              const hidden = Boolean(ch?.statistics?.hiddenSubscriberCount);
              const countryCode = ch?.snippet?.country || undefined;
              const vc = video?.statistics?.viewCount ? Number(video.statistics.viewCount) : 0;
              const lc = video?.statistics?.likeCount ? Number(video.statistics.likeCount) : undefined;
              const qualifiesRatio = qualifiesByRatio(vc, subCount, hidden, ratioThreshold);
              const qualifiesByMin = vc >= minViewsNum;
              const matchedRule: VideoRow["matchedRule"] = qualifiesRatio
                ? ((`${ratioThreshold}x`) as VideoRow["matchedRule"])
                : qualifiesByMin
                ? "minViews"
                : "none";
              const isShort = isShortByHeuristic(video as VideoData);
              return {
                videoId: video.id,
                title: video.snippet?.title || "",
                channelId: video.snippet?.channelId || "",
                channelTitle: video.snippet?.channelTitle || "",
                publishedAt: video.snippet?.publishedAt || "",
                viewCount: vc,
                likeCount: lc,
                thumbnailUrl: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || "",
                videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
                channelUrl: `https://www.youtube.com/channel/${video.snippet?.channelId}`,
                subscriberCount: subCount,
                hiddenSubscriberCount: hidden,
                country: countryCode,
                matchedRule,
                isShort,
              } as VideoRow;
            })
            .filter((r: VideoRow) => {
              const countryOk = country ? r.country?.toUpperCase() === country.toUpperCase() : true;
              const viewsOk = r.viewCount >= Number(minViews || 0);
              const shortsOk = shortsMode === "include" ? true : shortsMode === "only" ? !!r.isShort : !r.isShort;
              const ratioOk = r.matchedRule === `${ratioThreshold}x`;
              
              // 登録者数非公開の場合
              if (r.hiddenSubscriberCount) {
                return countryOk && shortsOk && viewsOk && includeHidden;
              }
              
              // 登録者数公開の場合：両方の条件を満たす必要がある
              return countryOk && shortsOk && viewsOk && ratioOk;
            });

          accum.push(...pageRows);
          // 並び順に合わせて安定化ソート
          const sorted = [...accum];
          if (displayOrder === "viewCount") {
            sorted.sort((a, b) => {
              if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
              const ad = new Date(a.publishedAt).getTime();
              const bd = new Date(b.publishedAt).getTime();
              if (bd !== ad) return bd - ad;
              return (a.videoId || "").localeCompare(b.videoId || "");
            });
          } else if (displayOrder === "date") {
            sorted.sort((a, b) => {
              const ad = new Date(a.publishedAt).getTime();
              const bd = new Date(b.publishedAt).getTime();
              if (bd !== ad) return bd - ad;
              if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
              return (a.videoId || "").localeCompare(b.videoId || "");
            });
          } else {
            sorted.sort((a, b) => {
              const ai = orderIndex[a.videoId] ?? Number.MAX_SAFE_INTEGER;
              const bi = orderIndex[b.videoId] ?? Number.MAX_SAFE_INTEGER;
              if (ai !== bi) return ai - bi;
              if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
              const ad = new Date(a.publishedAt).getTime();
              const bd = new Date(b.publishedAt).getTime();
              if (bd !== ad) return bd - ad;
              return (a.videoId || "").localeCompare(b.videoId || "");
            });
          }
          const limited = targetCount > 0 ? sorted.slice(0, targetCount) : sorted;
          setFilteredCount(limited.length);
          setVideos(limited);
          if (targetCount > 0 && accum.length >= targetCount) {
            pageToken = undefined; // 早期停止
          }
        }

        pageToken = sjson.nextPageToken;
      } while (pageToken && seenIds.size < maxTotal);

      // クォータ見積り
      const quota = searchRequests * 100 + videoRequests + channelRequests;
      setQuotaEstimate(quota);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setError("検索を中断しました");
      } else {
        setError(e instanceof Error ? e.message : "検索に失敗しました");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      setIsCancelling(false);
    }
  }

  async function fetchAllComments(videoId: string) {
    if (!apiKey) return;
    setCommentsLoadingFor(videoId);
    try {
      const all: CommentRow[] = [];
      let pageToken: string | undefined = undefined;
      do {
        const params = new URLSearchParams({
          key: apiKey,
          part: "snippet,replies",
          videoId,
          maxResults: "100",
          textFormat: "plainText",
        });
        if (pageToken) params.set("pageToken", pageToken);
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error?.message || `commentThreads.list HTTP ${res.status}`);
        }
        const json = await res.json();
        for (const th of json.items || []) {
          const tlc = th?.snippet?.topLevelComment;
          if (tlc) {
            all.push({
              videoId,
              commentId: tlc.id,
              parentId: null,
              authorDisplayName: tlc.snippet?.authorDisplayName || "",
              textOriginal: tlc.snippet?.textDisplay || tlc.snippet?.textOriginal || "",
              likeCount: tlc.snippet?.likeCount || 0,
              publishedAt: tlc.snippet?.publishedAt || "",
              updatedAt: tlc.snippet?.updatedAt || "",
            });
          }
          const replies = th?.replies?.comments || [];
          for (const rc of replies) {
            all.push({
              videoId,
              commentId: rc.id,
              parentId: rc.snippet?.parentId || tlc?.id || undefined,
              authorDisplayName: rc.snippet?.authorDisplayName || "",
              textOriginal: rc.snippet?.textDisplay || rc.snippet?.textOriginal || "",
              likeCount: rc.snippet?.likeCount || 0,
              publishedAt: rc.snippet?.publishedAt || "",
              updatedAt: rc.snippet?.updatedAt || "",
            });
          }
        }
        pageToken = json.nextPageToken;
      } while (pageToken);
      setCommentsByVideo((prev) => ({ ...prev, [videoId]: all }));
      setExpandedComments((prev) => ({ ...prev, [videoId]: true }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "コメント取得に失敗しました");
    } finally {
      setCommentsLoadingFor(null);
    }
  }

  function exportVideosCSV() {
    const headers = [
      "videoId",
      "title",
      "channelId",
      "channelTitle",
      "publishedAt",
      "viewCount",
      "subscriberCount",
      "likeCount",
      "country",
      "videoUrl",
      "thumbnailUrl",
      "matchedRule",
      "keywords",
      "searchedAt",
    ];
    const now = new Date().toISOString();
    const ratioLabel = `${ratioThreshold}x`;
    downloadCSV(
      `videos_${now}.csv`,
      videos,
      headers,
      (r: unknown, key: string) => {
        const row = r as VideoRow;
        switch (key) {
          case "videoId":
            return row.videoId;
          case "title":
            return row.title;
          case "channelId":
            return row.channelId;
          case "channelTitle":
            return row.channelTitle;
          case "publishedAt":
            return row.publishedAt;
          case "viewCount":
            return row.viewCount;
          case "subscriberCount":
            return row.subscriberCount ?? "";
          case "likeCount":
            return row.likeCount ?? "";
          case "country":
            return row.country ?? "";
          case "videoUrl":
            return row.videoUrl;
          case "thumbnailUrl":
            return row.thumbnailUrl;
          case "matchedRule":
            return row.matchedRule || ratioLabel;
          case "keywords":
            return query.trim() || "薄毛 対策 シャンプー";
          case "searchedAt":
            return now;
          default:
            return "";
        }
      }
    );
  }

  function exportSelectedCommentsCSV() {
    const videoIds = Object.keys(selected).filter((id) => selected[id]);
    const rows = videoIds.flatMap((id) => commentsByVideo[id] || []);
    if (!rows.length) {
      alert("選択中の動画に取得済みコメントがありません。");
      return;
    }
    const headers = [
      "videoId",
      "commentId",
      "parentId",
      "authorDisplayName",
      "textOriginal",
      "likeCount",
      "publishedAt",
      "updatedAt",
    ];
    const now = new Date().toISOString();
    downloadCSV(
      `comments_selected_${now}.csv`,
      rows,
      headers,
      (r: unknown, key: string) => (r as Record<string, unknown>)[key]
    );
  }

  function exportCommentsCSV(videoId: string) {
    const rows = commentsByVideo[videoId] || [];
    if (!rows.length) {
      alert("先にコメントを取得してください。");
      return;
    }
    const headers = [
      "videoId",
      "commentId",
      "parentId",
      "authorDisplayName",
      "textOriginal",
      "likeCount",
      "publishedAt",
      "updatedAt",
    ];
    const now = new Date().toISOString();
    downloadCSV(
      `comments_${videoId}_${now}.csv`,
      rows,
      headers,
      (r: unknown, key: string) => (r as Record<string, unknown>)[key]
    );
  }

  function runSelfTests() {
    const logs: string[] = [];
    try {
      const h = ["a", "b"]; const rows = [{ a: '1,2', b: '"q"' }];
      const csv = buildCSV(h, rows, (r, k) => (r as Record<string, unknown>)[k]);
      if (!csv.includes('\n')) throw new Error('CSV に改行が含まれません');
      if (!csv.includes('"1,2"')) throw new Error('カンマのエスケープに失敗');
      if (!csv.includes('""q""')) throw new Error('ダブルクォートのエスケープに失敗');
      logs.push('CSV 生成: OK');

      const d45 = durationToSeconds('PT45S');
      const d61 = durationToSeconds('PT1M1S');
      if (d45 !== 45 || d61 !== 61) throw new Error('duration 変換に失敗');
      const mockV1 = { snippet: { title: 'test', description: '', tags: [] }, contentDetails: { duration: 'PT45S' } };
      const mockV2 = { snippet: { title: 'test #Shorts', description: '', tags: [] }, contentDetails: { duration: 'PT2M' } };
      const mockV3 = { snippet: { title: 'test', description: 'no hash', tags: [] }, contentDetails: { duration: 'PT2M' } };
      if (!(isShortByHeuristic(mockV1) && isShortByHeuristic(mockV2) && !isShortByHeuristic(mockV3))) {
        throw new Error('Shorts 強化判定に失敗');
      }
      logs.push('Shorts 判定: OK');

      const now = Date.now();
      const d6m = new Date(calcPublishedAfter('6m')).getTime();
      if (!(d6m < now)) throw new Error('publishedAfter が未来を指しています');
      logs.push('calcPublishedAfter: OK');

      if (!(qualifiesByRatio(2500, 1000, false, 2) && !qualifiesByRatio(2500, 1000, false, 3))) {
        throw new Error('比率しきい値 2x/3x 判定に失敗');
      }
      if (qualifiesByRatio(2500, undefined, false, 1)) throw new Error('登録者数未取得でも合格になっています');
      if (qualifiesByRatio(2500, 1000, true, 1)) throw new Error('非公開登録者でも合格になっています');
      logs.push('比率しきい値: OK');

      setTestReport([`✅ セルフテスト成功`, ...logs]);
    } catch (e) {
      setTestReport([`❌ セルフテスト失敗: ${e instanceof Error ? e.message : 'Unknown error'}`]);
    }
  }

  // モバイル用ビデオカードコンポーネント
  const VideoCard = ({ v }: { v: VideoRow }) => {
    const isCommentsExpanded = expandedComments[v.videoId];
    const comments = commentsByVideo[v.videoId];
    
    return (
      <div className="border rounded-lg overflow-hidden mb-4" style={{ borderColor: COLORS.line }}>
        <div className="flex gap-3 p-3">
          <input
            type="checkbox"
            checked={!!selected[v.videoId]}
            onChange={(e) => setSelected((prev) => ({ ...prev, [v.videoId]: e.target.checked }))}
            className="w-5 h-5 mt-1 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <a href={v.videoUrl} target="_blank" rel="noreferrer" className="flex gap-3">
              <div className="w-32 h-18 flex-shrink-0">
                <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnailUrl} alt={v.title} className="absolute inset-0 w-full h-full object-cover rounded"/>
                  {v.isShort && (
                    <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black bg-opacity-75 px-1.5 py-0.5 rounded">
                      Shorts
                    </span>
                  )}
                  {/* 並び順のヒントバッジ */}
                  <span className="absolute top-1 left-1 text-[10px] text-white bg-black bg-opacity-60 px-1.5 py-0.5 rounded">
                    {displayOrder === 'viewCount' ? '再生数順' : displayOrder === 'date' ? '公開日順' : '関連度'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium line-clamp-2 mb-1">{v.title}</h3>
                <p className="text-xs text-neutral-600 truncate">{v.channelTitle}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3"/>
                    {numberFormat(v.viewCount)}
                  </span>
                  {!v.hiddenSubscriberCount && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3"/>
                      {numberFormat(v.subscriberCount)}
                    </span>
                  )}
                  {v.likeCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3"/>
                      {numberFormat(v.likeCount)}
                    </span>
                  )}
                </div>
                {mounted && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(v.publishedAt).toLocaleDateString('ja-JP')}
                    {v.country && ` · ${v.country}`}
                  </p>
                )}
              </div>
            </a>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  if (!comments) {
                    fetchAllComments(v.videoId);
                  } else {
                    setExpandedComments(prev => ({ ...prev, [v.videoId]: !prev[v.videoId] }));
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg border transition-colors"
                style={{ borderColor: COLORS.line }}
                disabled={commentsLoadingFor === v.videoId}
              >
                {commentsLoadingFor === v.videoId ? (
                  <Loader2 className="w-3 h-3 animate-spin"/>
                ) : (
                  <>
                    <MessageSquare className="w-3 h-3"/>
                    {comments ? `コメント (${comments.length})` : 'コメント取得'}
                    {comments && (
                      <ChevronDown className={`w-3 h-3 transition-transform ${isCommentsExpanded ? 'rotate-180' : ''}`}/>
                    )}
                  </>
                )}
              </button>
              {comments && (
                <button
                  onClick={() => exportCommentsCSV(v.videoId)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg border transition-colors"
                  style={{ borderColor: COLORS.line }}
                >
                  <Download className="w-3 h-3"/>
                  CSV
                </button>
              )}
            </div>
          </div>
        </div>
        {comments && isCommentsExpanded && (
          <div className="border-t max-h-64 overflow-y-auto" style={{ borderColor: COLORS.line }}>
            {comments.slice(0, 10).map((c) => (
              <div key={c.commentId} className="p-3 border-b" style={{ borderColor: COLORS.line }}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium">{c.authorDisplayName}</span>
                  {mounted && (
                    <span className="text-xs text-neutral-500">
                      {new Date(c.publishedAt).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-700 whitespace-pre-wrap">{c.textOriginal}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-500">👍 {numberFormat(c.likeCount)}</span>
                </div>
              </div>
            ))}
            {comments.length > 10 && (
              <div className="p-3 text-center text-xs text-neutral-500">
                他 {comments.length - 10} 件のコメント
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      {/* ヘッダー（モバイル最適化） */}
      <header className="sticky top-0 z-20 border-b bg-white" style={{ borderColor: COLORS.line }}>
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-sm" style={{ backgroundColor: COLORS.accent }} />
              <h1 className="text-lg md:text-xl font-semibold">YT分析</h1>
              <span className="hidden sm:inline-block ml-1 text-xs md:text-sm text-neutral-500">MVP</span>
              <Link
                href="/guide"
                className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                title="使い方ガイド"
              >
                <BookOpen className="w-4 h-4"/>
                <span className="hidden sm:inline">ガイド</span>
              </Link>
            </div>
            {/* デスクトップ：インライン表示 */}
            <div className="hidden lg:flex items-center gap-2">
              <input
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none w-64"
                style={{ borderColor: COLORS.line }}
                type="password"
                placeholder="APIキーを入力"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                onClick={onSaveKey}
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm"
                style={{ backgroundColor: COLORS.accent }}
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                保存
              </button>
              {keyVerified ? (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4"/>有効
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
                  <AlertTriangle className="w-4 h-4"/>未設定
                </span>
              )}
            </div>
            {/* モバイル：メニューボタン */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg"
              style={{ backgroundColor: keyVerified ? 'transparent' : COLORS.accent }}
            >
              {keyVerified ? (
                <CheckCircle2 className="w-5 h-5 text-green-600"/>
              ) : (
                <Menu className="w-5 h-5 text-white"/>
              )}
            </button>
          </div>
          {verifyError && (
            <div className="mt-2 text-sm text-red-600">{verifyError}</div>
          )}
        </div>
      </header>

      {/* モバイル用APIキーモーダル */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">APIキー設定</h2>
              <button onClick={() => setShowApiKeyModal(false)}>
                <X className="w-5 h-5"/>
              </button>
            </div>
            <input
              className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none"
              style={{ borderColor: COLORS.line }}
              type="password"
              placeholder="YouTube Data API v3のキーを入力"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              onClick={onSaveKey}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white"
              style={{ backgroundColor: COLORS.accent }}
              disabled={verifying}
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
              保存して疎通確認
            </button>
            {verifyError && (
              <p className="mt-3 text-sm text-red-600">{verifyError}</p>
            )}
          </div>
        </div>
      )}

      {/* 検索フォーム（モバイル最適化） */}
      <section className="mx-auto max-w-6xl px-4 py-4 md:py-6">
        <div className="border rounded-xl p-3 md:p-4" style={{ borderColor: COLORS.line }}>
          {/* モバイル：折りたたみ可能なフィルター */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 mb-3">
              <input
                className="flex-1 border rounded-lg px-3 py-2.5 focus:outline-none"
                style={{ borderColor: COLORS.line }}
                placeholder="検索キーワード"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center justify-center p-2.5 rounded-lg border"
                style={{ borderColor: COLORS.line }}
              >
                <Filter className="w-5 h-5"/>
              </button>
            </div>
            {!showFilters && (
              <ActiveFilters />
            )}
            {showFilters && (
              <div className="space-y-3 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">最低再生数</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                      style={{ borderColor: COLORS.line }}
                      type="number"
                      placeholder="10000"
                      value={minViews}
                      onChange={(e) => setMinViews(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">国</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                      style={{ borderColor: COLORS.line }}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      {COUNTRY_OPTIONS.map(opt => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">期間</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                      style={{ borderColor: COLORS.line }}
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as PeriodKey)}
                    >
                      <option value="6m">半年</option>
                      <option value="1y">1年</option>
                      <option value="2y">2年</option>
                      <option value="3y">3年</option>
                      <option value="5y">5年</option>
                      <option value="10y">10年</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">最大取得件数</label>
                    <Chips value={maxTotal} options={[50,100,200,300,500]} onChange={setMaxTotal} />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">ショート</label>
                    <Segments
                      value={shortsMode}
                      options={[{label:'除外',value:'exclude'},{label:'含む',value:'include'},{label:'のみ',value:'only'}]}
                      onChange={(v)=>setShortsMode(v as ShortsMode)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">登録者比</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                      style={{ borderColor: COLORS.line }}
                      value={ratioThreshold}
                      onChange={(e) => setRatioThreshold(Number(e.target.value) as RatioThreshold)}
                    >
                      <option value={3}>3倍以上</option>
                      <option value={2}>2倍以上</option>
                      <option value={1}>1倍以上</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">並び順</label>
                    <Segments
                      value={displayOrder}
                      options={[{label:'再生数',value:'viewCount'},{label:'公開日',value:'date'},{label:'関連度',value:'relevance'}]}
                      onChange={(v)=>setDisplayOrder(v as any)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 mb-1 block">関連言語</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                      style={{ borderColor: COLORS.line }}
                      value={relevanceLanguage}
                      onChange={(e) => setRelevanceLanguage(e.target.value)}
                    >
                      <option value="">自動</option>
                      <option value="ja">日本語</option>
                      <option value="en">英語</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={includeHidden}
                    onChange={(e) => setIncludeHidden(e.target.checked)}
                  />
                  <span className="text-xs">登録者数非公開も含める</span>
                </label>
                <div>
                  <label className="text-xs text-neutral-600 mb-1 block">停止条件（表示がN件に達したら停止）</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                    style={{ borderColor: COLORS.line }}
                    type="number"
                    min={0}
                    placeholder="0（無効）"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* デスクトップ：通常表示 */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-5 h-5"/>
              <h2 className="text-lg font-semibold">検索条件</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-neutral-600">キーワード</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                  style={{ borderColor: COLORS.line }}
                  placeholder="例: 薄毛 対策 シャンプー"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">最低再生数（既定 10000）</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                  style={{ borderColor: COLORS.line }}
                  type="number"
                  min={0}
                  placeholder="10000"
                  value={minViews}
                  onChange={(e) => setMinViews(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">国指定</label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-500"/>
                  <select
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                    style={{ borderColor: COLORS.line }}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {COUNTRY_OPTIONS.map(opt => (
                      <option key={opt.code} value={opt.code}>{opt.label}{opt.code ? `（${opt.code}）` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-600">関連言語</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                  style={{ borderColor: COLORS.line }}
                  value={relevanceLanguage}
                  onChange={(e) => setRelevanceLanguage(e.target.value)}
                >
                  <option value="">自動</option>
                  <option value="ja">日本語（ja）</option>
                  <option value="en">英語（en）</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-neutral-600">対象期間</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                  style={{ borderColor: COLORS.line }}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as PeriodKey)}
                >
                  <option value="6m">直近半年</option>
                  <option value="1y">直近1年</option>
                  <option value="2y">直近2年</option>
                  <option value="3y">直近3年（既定）</option>
                  <option value="5y">直近5年</option>
                  <option value="10y">直近10年</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-neutral-600">最大取得件数</label>
                <Chips value={maxTotal} options={[50,100,200,300,500]} onChange={setMaxTotal} />
              </div>
              <div>
                <label className="text-sm text-neutral-600">並び順</label>
                <Segments
                  value={displayOrder}
                  options={[{label:'再生数',value:'viewCount'},{label:'公開日',value:'date'},{label:'関連度',value:'relevance'}]}
                  onChange={(v)=>setDisplayOrder(v as any)}
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">停止条件（表示がN件に達したら停止）</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                  style={{ borderColor: COLORS.line }}
                  type="number"
                  min={0}
                  placeholder="0（無効）"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">ショートの扱い</label>
                <Segments
                  value={shortsMode}
                  options={[{label:'除外',value:'exclude'},{label:'含む',value:'include'},{label:'のみ',value:'only'}]}
                  onChange={(v)=>setShortsMode(v as ShortsMode)}
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">登録者比しきい値</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none bg-white"
                  style={{ borderColor: COLORS.line }}
                  value={ratioThreshold}
                  onChange={(e) => setRatioThreshold(Number(e.target.value) as RatioThreshold)}
                >
                  <option value={3}>3倍以上（既定）</option>
                  <option value={2}>2倍以上</option>
                  <option value={1}>1倍以上</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center gap-3">
                <input
                  id="includeHidden"
                  type="checkbox"
                  className="w-4 h-4"
                  checked={includeHidden}
                  onChange={(e) => setIncludeHidden(e.target.checked)}
                />
                <label htmlFor="includeHidden" className="text-sm">
                  登録者数非公開チャンネルも含める（この場合は最低再生数のみで判定）
                </label>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <ActiveFilters />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={runSearch}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white"
              style={{ backgroundColor: COLORS.accent }}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
              検索
            </button>
            {loading && (
              <button
                onClick={() => { setIsPaused((p) => !p); }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border"
                style={{ borderColor: COLORS.line }}
              >
                {isPaused ? '再開' : '一時停止'}
              </button>
            )}
            {loading && (
              <button
                onClick={() => { setIsCancelling(true); abortRef.current?.abort(); }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-red-600"
                style={{ borderColor: COLORS.line }}
              >
                中断
              </button>
            )}
            <button
              onClick={exportVideosCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border"
              style={{ borderColor: COLORS.line }}
              disabled={!videos.length}
            >
              <Download className="w-4 h-4"/>
              一覧CSV
            </button>
            {Object.values(selected).some(Boolean) && (
              <button
                onClick={exportSelectedCommentsCSV}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border"
                style={{ borderColor: COLORS.line }}
              >
                <Download className="w-4 h-4"/>
                選択コメントCSV
              </button>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-2 text-xs text-neutral-500 space-y-1">
            {mounted && publishedAfter && (
              <p>対象期間: {new Date(publishedAfter).toLocaleDateString('ja-JP')} 以降</p>
            )}
            {(scannedCount > 0 || filteredCount > 0) && (
              <p>走査件数: {scannedCount.toLocaleString()} 件 ／ 表示件数: {filteredCount.toLocaleString()} 件</p>
            )}
            {quotaEstimate > 0 && (
              <p>APIクォータ見積り: 約 {quotaEstimate} ユニット</p>
            )}
            {/* 進捗バーは上段やモバイルバーにも表示するためここは補助表示のまま */}
            {loading && (
              <div className="w-full h-1 bg-neutral-200 rounded">
                <div className="h-1 bg-red-500 rounded" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* モバイル下部アクションバー */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-white" style={{ borderColor: COLORS.line }}>
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-2">
          <button
            onClick={runSearch}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white"
            style={{ backgroundColor: COLORS.accent }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
            検索
          </button>
          {loading && (
            <button
              onClick={() => { setIsPaused((p) => !p); }}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border"
              style={{ borderColor: COLORS.line }}
            >
              {isPaused ? '再開' : '一時停止'}
            </button>
          )}
          {loading && (
            <button
              onClick={() => { setIsCancelling(true); abortRef.current?.abort(); }}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-red-600"
              style={{ borderColor: COLORS.line }}
            >
              中断
            </button>
          )}
        </div>
        {loading && (
          <div className="px-4 pb-2">
            <div className="w-full h-2 bg-neutral-200 rounded">
              <div className="h-2 bg-red-500 rounded" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* 結果表示（レスポンシブ対応） */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        {/* モバイル：カード表示 */}
        <div className="lg:hidden">
          {loading && (
            <div className="text-center py-8 text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>
              読み込み中...
            </div>
          )}
          {!loading && videos.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              結果はありません
            </div>
          )}
          {!loading && videos.map(v => (
            <VideoCard key={v.videoId} v={v} />
          ))}
        </div>

        {/* デスクトップ：テーブル表示 */}
        <div className="hidden lg:block border rounded-xl overflow-hidden" style={{ borderColor: COLORS.line }}>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left">
                <th className="p-3 border-b w-10" style={{ borderColor: COLORS.line }}></th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>サムネ</th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>タイトル</th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>チャンネル</th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>
                  <span className="inline-flex items-center gap-1">
                    再生数
                    {displayOrder === 'viewCount' && (
                      <span className="text-neutral-400">▾</span>
                    )}
                  </span>
                </th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>登録者数</th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>高評価</th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>
                  <span className="inline-flex items-center gap-1">
                    公開日
                    {displayOrder === 'date' && (
                      <span className="text-neutral-400">▾</span>
                    )}
                  </span>
                </th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>国</th>
                <th className="p-3 border-b" style={{ borderColor: COLORS.line }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="p-6 text-center text-neutral-500" colSpan={10}>読み込み中...</td></tr>
              )}
              {!loading && videos.length === 0 && (
                <tr><td className="p-6 text-center text-neutral-500" colSpan={10}>結果はありません。</td></tr>
              )}
              {!loading && videos.map(v => (
                <React.Fragment key={v.videoId}>
                  <tr className="hover:bg-neutral-50 border-t" style={{ borderColor: COLORS.line }}>
                    <td className="p-2 align-middle" style={{ verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={!!selected[v.videoId]}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [v.videoId]: e.target.checked }))}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-2">
                      <a href={v.videoUrl} target="_blank" rel="noreferrer">
                        <div className="relative w-32" style={{ aspectRatio: '16 / 9' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.thumbnailUrl} alt={v.title} className="absolute inset-0 w-full h-full object-cover rounded"/>
                          {v.isShort && (
                            <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black bg-opacity-75 px-1.5 py-0.5 rounded">Shorts</span>
                          )}
                        </div>
                      </a>
                    </td>
                    <td className="p-2 align-top">
                      <a href={v.videoUrl} target="_blank" rel="noreferrer" className="hover:underline">{v.title}</a>
                      {v.isShort ? <span className="ml-2 text-[10px] text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.accent }}>Shorts</span> : null}
                    </td>
                    <td className="p-2 align-top">
                      <a href={v.channelUrl} target="_blank" rel="noreferrer" className="hover:underline">{v.channelTitle}</a>
                    </td>
                    <td className="p-2 align-top">{numberFormat(v.viewCount)}</td>
                    <td className="p-2 align-top">{v.hiddenSubscriberCount ? "非公開" : numberFormat(v.subscriberCount)}</td>
                    <td className="p-2 align-top">{v.likeCount !== undefined ? numberFormat(v.likeCount) : "-"}</td>
                    <td className="p-2 align-top">
                      {mounted ? new Date(v.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' }) : ''}
                    </td>
                    <td className="p-2 align-top">{v.country || "-"}</td>
                    <td className="p-2 align-top">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => fetchAllComments(v.videoId)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border transition-colors hover:bg-neutral-50 disabled:opacity-50 whitespace-nowrap"
                          style={{ borderColor: COLORS.line, minWidth: '80px' }}
                          disabled={commentsLoadingFor === v.videoId}
                        >
                          {commentsLoadingFor === v.videoId ? (
                            <Loader2 className="w-3 h-3 animate-spin"/>
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3"/>
                              コメント
                            </>
                          )}
                        </button>
                        {commentsByVideo[v.videoId]?.length ? (
                          <>
                            <button
                              onClick={() => exportCommentsCSV(v.videoId)}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs rounded border transition-colors hover:bg-neutral-50 whitespace-nowrap"
                              style={{ borderColor: COLORS.line, minWidth: '80px' }}
                            >
                              <Download className="w-3 h-3"/>
                              CSV
                            </button>
                            <span className="text-[10px] text-neutral-500 text-center">
                              {commentsByVideo[v.videoId].length}件
                            </span>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {commentsByVideo[v.videoId]?.length ? (
                    <tr>
                      <td colSpan={10} className="p-0 border-t" style={{ borderColor: COLORS.line }}>
                        <div className="max-h-80 overflow-auto p-3 bg-neutral-50">
                          {commentsByVideo[v.videoId].map((c) => (
                            <div key={c.commentId} className="mb-3 border-b pb-2" style={{ borderColor: COLORS.line }}>
                              <div className="text-xs text-neutral-600 flex items-center justify-between">
                                <span>{c.authorDisplayName}</span>
                                <span>
                                  {mounted ? new Date(c.publishedAt).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <div className="mt-1 text-sm whitespace-pre-wrap">{c.textOriginal}</div>
                              <div className="mt-1 text-xs text-neutral-500">👍 {numberFormat(c.likeCount)} / ID: {c.commentId}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} YouTube運用支援ツール（MVP）
        {testReport.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer">Diagnostics</summary>
            <ul className="mt-1 text-left inline-block">
              {testReport.map((t, i) => (
                <li key={i} className="mt-0.5">{t}</li>
              ))}
            </ul>
          </details>
        )}
      </footer>
    </div>
  );
}
