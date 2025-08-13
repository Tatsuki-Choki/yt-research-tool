'use client'

import { ArrowLeft, Search, Download, MessageSquare, TrendingUp, Sparkles, Youtube, BookOpen, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// デザインガイド2.1 & 2.2準拠のトークン
const COLORS = {
  bg: '#FFFFFF',
  textStrong: '#0F0F0F',
  text: '#212121',
  muted: '#606060',
  line: '#E5E5E5',
  accent: '#FF0000',
  accentPress: '#CC0000',
  focus: '#1A73E8',
}

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = [
    { id: 'getting-started', label: '始め方', icon: Sparkles },
    { id: 'search', label: '動画検索', icon: Search },
    { id: 'analysis', label: '分析機能', icon: TrendingUp },
    { id: 'comments', label: 'コメント取得', icon: MessageSquare },
    { id: 'export', label: 'データ出力', icon: Download },
    { id: 'tips', label: '活用のコツ', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* ヘッダー */}
      <header className="sticky top-0 z-10" style={{ backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.line}` }}>
        <div className="max-w-7xl mx-auto" style={{ padding: `${SPACING.md}px ${SPACING.lg}px` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: `${SPACING.md}px` }}>
              <Link href="/" className="flex items-center transition-opacity hover:opacity-80" style={{ gap: `${SPACING.sm}px`, color: COLORS.muted }}>
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">ツールに戻る</span>
              </Link>
              <div className="flex items-center" style={{ gap: `${SPACING.sm}px` }}>
                <Youtube className="w-6 h-6" style={{ color: COLORS.accent }} />
                <h1 className="text-xl font-bold" style={{ color: COLORS.textStrong }}>使い方ガイド</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto" style={{ padding: `${SPACING.xl}px ${SPACING.lg}px` }}>
        <div className="lg:grid lg:grid-cols-4" style={{ gap: `${SPACING.xl}px` }}>
          {/* サイドバー（デスクトップ） */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="w-full flex items-center transition-all"
                    style={{
                      gap: `${SPACING.sm}px`,
                      padding: `${SPACING.sm}px ${SPACING.md}px`,
                      borderRadius: `${SPACING.sm}px`,
                      backgroundColor: activeSection === section.id ? COLORS.line : 'transparent',
                      color: activeSection === section.id ? COLORS.textStrong : COLORS.muted,
                      fontWeight: activeSection === section.id ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== section.id) {
                        e.currentTarget.style.backgroundColor = '#F5F5F5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== section.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{section.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* モバイルタブ */}
          <div className="lg:hidden mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{section.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* メインコンテンツ */}
          <main className="lg:col-span-3 space-y-8">
            {activeSection === 'getting-started' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    始め方
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-blue-900 font-medium mb-2">このツールでできること</p>
                      <p className="text-blue-800 text-sm">
                        YouTube動画を検索し、チャンネル登録者数に対する再生回数の比率（バズ度）を分析できます。
                        話題になっている動画を見つけたり、コメントを分析することで、トレンドを把握できます。
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">📝 ステップ1: APIキーの設定</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p className="text-sm text-gray-700">YouTube Data API v3のAPIキーが必要です。</p>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                          <li>Google Cloud Consoleにアクセス</li>
                          <li>YouTube Data API v3を有効化</li>
                          <li>認証情報からAPIキーを作成</li>
                          <li>取得したAPIキーを設定画面に入力</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">🔍 ステップ2: 検索条件の設定</h3>
                      <p className="text-sm text-gray-700">
                        検索したいキーワードと条件を設定します。対象期間や最小再生回数など、細かな条件設定が可能です。
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">📊 ステップ3: 結果の分析</h3>
                      <p className="text-sm text-gray-700">
                        検索結果から「バズっている」動画を見つけ、コメントを取得して詳細な分析ができます。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'search' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="w-6 h-6 text-blue-600" />
                    動画検索の仕組み
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">🔎 検索の流れ</h3>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                        <ol className="space-y-3">
                          <li className="flex items-start gap-3">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                            <div>
                              <p className="font-medium text-gray-900">キーワード検索</p>
                              <p className="text-sm text-gray-600">入力されたキーワードでYouTube APIを使って動画を検索</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                            <div>
                              <p className="font-medium text-gray-900">詳細情報取得</p>
                              <p className="text-sm text-gray-600">各動画の再生回数、いいね数などの統計情報を取得</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                            <div>
                              <p className="font-medium text-gray-900">チャンネル情報取得</p>
                              <p className="text-sm text-gray-600">各チャンネルの登録者数を取得して比率を計算</p>
                            </div>
                          </li>
                        </ol>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">⚙️ 検索条件の詳細</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">対象期間</h4>
                          <p className="text-sm text-gray-600">
                            半年〜10年の範囲で設定可能。最近の動画や長期的なトレンドを分析できます。
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">最小再生回数</h4>
                          <p className="text-sm text-gray-600">
                            ノイズを除外するため、指定した再生回数以上の動画のみを表示します。
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">ショート動画</h4>
                          <p className="text-sm text-gray-600">
                            60秒以下の動画を含める/除外/ショートのみの3つから選択できます。
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">国/地域</h4>
                          <p className="text-sm text-gray-600">
                            日本、アメリカなど特定の地域の動画に絞って検索できます。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'analysis' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    分析機能の詳細
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">📈 バズ度の計算方法</h3>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                        <p className="text-gray-700 mb-3">
                          <span className="font-medium">バズ度 = 再生回数 ÷ チャンネル登録者数</span>
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">1倍〜</span>
                            <span className="text-gray-600">登録者数と同じくらいの再生回数</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">2倍〜</span>
                            <span className="text-gray-600">登録者数の2倍の再生回数（話題性あり）</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-medium">3倍〜</span>
                            <span className="text-gray-600">登録者数の3倍以上（バズっている）</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">🎯 活用シーン</h3>
                      <div className="grid gap-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-gray-900">トレンド分析</h4>
                          <p className="text-sm text-gray-600">
                            特定のキーワードでバズっている動画を見つけ、どんな内容が注目されているか分析
                          </p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-medium text-gray-900">競合調査</h4>
                          <p className="text-sm text-gray-600">
                            同じジャンルの動画でどれくらいの再生回数が期待できるか把握
                          </p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-4">
                          <h4 className="font-medium text-gray-900">コンテンツ企画</h4>
                          <p className="text-sm text-gray-600">
                            高いエンゲージメントを得ている動画の特徴を分析し、企画に活かす
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'comments' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                    コメント取得機能
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                      <p className="text-purple-900 font-medium mb-2">💡 コメント分析の重要性</p>
                      <p className="text-purple-800 text-sm">
                        視聴者の生の声を分析することで、動画の評価ポイントや改善点、視聴者のニーズを把握できます。
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">📥 取得方法</h3>
                      <ol className="space-y-3">
                        <li className="flex items-start gap-3">
                          <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                          <div>
                            <p className="font-medium text-gray-900">動画を選択</p>
                            <p className="text-sm text-gray-600">検索結果から分析したい動画の「コメント取得」ボタンをクリック</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                          <div>
                            <p className="font-medium text-gray-900">自動取得</p>
                            <p className="text-sm text-gray-600">最大100件のコメントを自動で取得（返信は含まれません）</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                          <div>
                            <p className="font-medium text-gray-900">表示・分析</p>
                            <p className="text-sm text-gray-600">取得したコメントが表示され、CSVで出力可能</p>
                          </div>
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">📊 取得できる情報</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">コメント本文</p>
                          <p className="text-xs text-gray-600">視聴者の感想や意見</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">投稿者名</p>
                          <p className="text-xs text-gray-600">コメントした人の名前</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">いいね数</p>
                          <p className="text-xs text-gray-600">コメントへの共感度</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">投稿日時</p>
                          <p className="text-xs text-gray-600">いつ投稿されたか</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'export' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Download className="w-6 h-6 text-indigo-600" />
                    データ出力機能
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">📁 CSV出力</h3>
                      <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                        <p className="text-gray-700">
                          検索結果とコメントをCSV形式でダウンロードできます。ExcelやGoogleスプレッドシートで開いて詳細な分析が可能です。
                        </p>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">動画リストCSV</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• タイトル、URL、再生回数、いいね数</li>
                            <li>• チャンネル名、登録者数</li>
                            <li>• バズ度（再生回数/登録者数）</li>
                            <li>• 投稿日時、動画の長さ</li>
                          </ul>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">コメントCSV</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• コメント本文</li>
                            <li>• 投稿者名</li>
                            <li>• いいね数</li>
                            <li>• 投稿日時</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">💡 活用例</h3>
                      <div className="grid gap-3">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 mb-1">定期的なレポート作成</p>
                          <p className="text-sm text-gray-600">
                            週次・月次でデータを出力し、トレンドの変化を追跡
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 mb-1">詳細分析</p>
                          <p className="text-sm text-gray-600">
                            Excelのピボットテーブルなどを使った深い分析
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 mb-1">チーム共有</p>
                          <p className="text-sm text-gray-600">
                            分析結果をチームメンバーと簡単に共有
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tips' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                    活用のコツ
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">🎯 効果的な検索のポイント</h3>
                      <div className="space-y-3">
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">1. キーワードの工夫</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• 複数のキーワードをスペースで区切って入力</li>
                            <li>• &quot;&quot;で囲むと完全一致検索</li>
                            <li>• トレンドワードと組み合わせる</li>
                          </ul>
                        </div>
                        
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">2. 期間設定の使い分け</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• 最新トレンド：半年〜1年</li>
                            <li>• 定番コンテンツ：2〜3年</li>
                            <li>• 長期分析：5〜10年</li>
                          </ul>
                        </div>
                        
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">3. フィルタリングの活用</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• 最小再生回数で質の高い動画に絞る</li>
                            <li>• ショート動画の除外/含むを使い分ける</li>
                            <li>• 地域設定で特定市場の動向を把握</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">⚠️ 注意事項</h3>
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900">APIの利用制限</p>
                            <p className="text-sm text-red-800">
                              YouTube APIには1日あたりの利用制限があります。大量の検索や頻繁なコメント取得は控えめに。
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900">データの取り扱い</p>
                            <p className="text-sm text-red-800">
                              取得したデータは個人情報を含む場合があります。適切に管理してください。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">🚀 上級者向けテクニック</h3>
                      <div className="grid gap-3">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 mb-1">定点観測</p>
                          <p className="text-sm text-gray-700">
                            同じキーワードで定期的に検索し、トレンドの変化を追跡
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 mb-1">クロス分析</p>
                          <p className="text-sm text-gray-700">
                            複数のキーワードで検索し、共通点や差異を分析
                          </p>
                        </div>
                        <div className="bg-gradient-to-r from-pink-50 to-red-50 p-4 rounded-lg">
                          <p className="font-medium text-gray-900 mb-1">競合ベンチマーク</p>
                          <p className="text-sm text-gray-700">
                            競合チャンネルの動画を分析し、成功パターンを把握
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}