// scripts/og-image/render.js
//
// satori + @resvg/resvg-js로 1200x630 OG 이미지(PNG)를 렌더한다.
// 한국어 제목을 위해 Pretendard TTF(한글+라틴 통합)를 임베드한다.
//
// 외부 네트워크·헤드리스 브라우저 없이 빌드타임에 순수 함수로 동작한다.
//
// 디자인: 브랜드 로고 타일 + 워드마크, 카테고리 pill, accent radial glow,
// 기하학적 concentric 프레임(건물/레이어 모티브)으로 우측 여백을 채운다.

const fs = require('fs');
const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..', '..');
const FONT_DIR = path.join(
  ROOT,
  'node_modules/pretendard/dist/public/static/alternative'
);

// 폰트는 모듈 로드 시 1회만 읽는다(전체 렌더에서 재사용).
const FONTS = [
  {
    name: 'Pretendard',
    data: fs.readFileSync(path.join(FONT_DIR, 'Pretendard-Bold.ttf')),
    weight: 700,
    style: 'normal',
  },
  {
    name: 'Pretendard',
    data: fs.readFileSync(path.join(FONT_DIR, 'Pretendard-Regular.ttf')),
    weight: 400,
    style: 'normal',
  },
  {
    name: 'Pretendard',
    data: fs.readFileSync(path.join(FONT_DIR, 'Pretendard-SemiBold.ttf')),
    weight: 600,
    style: 'normal',
  },
];

// 실제 사이트 로고(static/img/logo.svg)를 data URI로 임베드한다.
const LOGO_DATA_URI =
  'data:image/svg+xml;base64,' +
  fs.readFileSync(path.join(ROOT, 'static/img/logo.svg')).toString('base64');

// 카테고리별 라벨 + 액센트 색상 (사이트 톤과 일치)
const CATEGORY_THEME = {
  'eks-best-practices': { label: 'EKS BEST PRACTICES', accent: '#38bdf8' },
  'agentic-ai-platform': { label: 'AGENTIC AI PLATFORM', accent: '#818cf8' },
  aidlc: { label: 'AIDLC', accent: '#a78bfa' },
  'hybrid-infrastructure': { label: 'HYBRID INFRASTRUCTURE', accent: '#22d3ee' },
  'security-governance': { label: 'SECURITY & GOVERNANCE', accent: '#fb7185' },
  rosa: { label: 'ROSA', accent: '#f87171' },
  benchmarks: { label: 'BENCHMARKS', accent: '#34d399' },
  'industry-solutions': { label: 'INDUSTRY SOLUTIONS', accent: '#fbbf24' },
  sales: { label: 'SALES', accent: '#f472b6' },
  __root__: { label: 'ENGINEERING PLAYBOOK', accent: '#60a5fa' },
};

function themeFor(category) {
  return CATEGORY_THEME[category] || CATEGORY_THEME.__root__;
}

// #rrggbb → rgba(r,g,b,a)
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 제목 길이에 따라 폰트 크기를 단계적으로 줄인다(satori는 자동 줄바꿈 지원).
function titleFontSize(title) {
  const len = [...(title || '')].length;
  if (len <= 22) return 64;
  if (len <= 38) return 56;
  if (len <= 56) return 46;
  return 38;
}

// 우측 여백을 채우는 기하학적 concentric 프레임 1개 (건물/레이어 모티브).
function frame({ size, top, right, accent, alpha, fill }) {
  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        top,
        right,
        width: size,
        height: size,
        border: `2px solid ${hexToRgba(accent, alpha)}`,
        borderRadius: 36,
        transform: 'rotate(18deg)',
        ...(fill ? { background: hexToRgba(accent, fill) } : {}),
      },
    },
  };
}

// OG 이미지 1장의 satori 트리를 만든다.
function buildTree({ title, category, siteLabel }) {
  const theme = themeFor(category);
  const accent = theme.accent;

  return {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, #0a0e1a 0%, #0e1430 55%, #131a3c 100%)',
        fontFamily: 'Pretendard',
      },
      children: [
        // (배경 1) accent radial glow — 우측 상단 여백을 채운다
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: -160,
              right: -140,
              width: 560,
              height: 560,
              borderRadius: 9999,
              background: `radial-gradient(circle at center, ${hexToRgba(
                accent,
                0.32
              )} 0%, ${hexToRgba(accent, 0)} 70%)`,
            },
          },
        },
        // (배경 2) concentric 프레임 3중 — 레이어/아키텍처 모티브
        frame({ size: 470, top: 70, right: -170, accent, alpha: 0.16 }),
        frame({ size: 330, top: 150, right: -70, accent, alpha: 0.26 }),
        frame({ size: 190, top: 230, right: 30, accent, alpha: 0.42, fill: 0.06 }),
        // (배경 3) 좌측 상단 미세 글로우로 콘텐츠 영역 분위기
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: -200,
              left: -120,
              width: 480,
              height: 480,
              borderRadius: 9999,
              background: `radial-gradient(circle at center, ${hexToRgba(
                accent,
                0.1
              )} 0%, ${hexToRgba(accent, 0)} 70%)`,
            },
          },
        },

        // (전경) 콘텐츠 레이어 — 마지막 형제라 위에 그려진다
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              padding: '58px 68px',
            },
            children: [
              // 상단: 로고 타일 + 워드마크
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 68,
                          height: 68,
                          borderRadius: 16,
                          background:
                            'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          boxShadow: `0 8px 24px ${hexToRgba(accent, 0.25)}`,
                          marginRight: 22,
                        },
                        children: [
                          {
                            type: 'img',
                            props: {
                              src: LOGO_DATA_URI,
                              width: 42,
                              height: 42,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: 28,
                                fontWeight: 700,
                                color: '#f1f5f9',
                                lineHeight: 1.1,
                              },
                              children: 'Engineering Playbook',
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: 18,
                                fontWeight: 400,
                                color: '#7c89a8',
                                letterSpacing: 1,
                              },
                              children: 'EKS · Agentic AI · MLOps',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },

              // 중앙: 카테고리 pill + 제목
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    // 카테고리 pill
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          alignSelf: 'flex-start',
                          background: hexToRgba(accent, 0.13),
                          border: `1px solid ${hexToRgba(accent, 0.4)}`,
                          borderRadius: 9999,
                          padding: '9px 20px',
                          marginBottom: 26,
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                width: 9,
                                height: 9,
                                borderRadius: 9999,
                                background: accent,
                                marginRight: 11,
                              },
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: 21,
                                fontWeight: 600,
                                color: accent,
                                letterSpacing: 1.5,
                              },
                              children: theme.label,
                            },
                          },
                        ],
                      },
                    },
                    // 제목
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: titleFontSize(title),
                          fontWeight: 700,
                          color: '#ffffff',
                          lineHeight: 1.22,
                          letterSpacing: -0.5,
                          maxWidth: 880,
                        },
                        children: title,
                      },
                    },
                  ],
                },
              },

              // 하단: accent divider + 도메인
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 72,
                          height: 5,
                          borderRadius: 9999,
                          background: accent,
                          boxShadow: `0 0 16px ${hexToRgba(accent, 0.6)}`,
                          marginBottom: 18,
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 25,
                          fontWeight: 400,
                          color: '#94a3b8',
                        },
                        children: siteLabel,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// 비동기: title/category → PNG Buffer
async function renderOgImage({ title, category, siteLabel }) {
  const svg = await satori(buildTree({ title, category, siteLabel }), {
    width: 1200,
    height: 630,
    fonts: FONTS,
  });
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })
    .render()
    .asPng();
  return png;
}

module.exports = { renderOgImage, themeFor, CATEGORY_THEME };
