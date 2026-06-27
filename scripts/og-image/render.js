// scripts/og-image/render.js
//
// satori + @resvg/resvg-js로 1200x630 OG 이미지(PNG)를 렌더한다.
// 한국어 제목을 위해 Pretendard TTF(한글+라틴 통합)를 임베드한다.
//
// 외부 네트워크·헤드리스 브라우저 없이 빌드타임에 순수 함수로 동작한다.

const fs = require('fs');
const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..', '..');
const FONT_DIR = path.join(
  ROOT,
  'node_modules/pretendard/dist/public/static/alternative'
);

// 폰트는 모듈 로드 시 1회만 읽는다(269회 렌더에서 재사용).
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

// 카테고리별 라벨 + 액센트 색상 (사이트 톤과 일치)
const CATEGORY_THEME = {
  'eks-best-practices': { label: 'EKS BEST PRACTICES', accent: '#36c5f0' },
  'agentic-ai-platform': { label: 'AGENTIC AI PLATFORM', accent: '#7aa2f7' },
  aidlc: { label: 'AIDLC', accent: '#a78bfa' },
  'hybrid-infrastructure': { label: 'HYBRID INFRASTRUCTURE', accent: '#22d3ee' },
  'security-governance': { label: 'SECURITY & GOVERNANCE', accent: '#f87171' },
  rosa: { label: 'ROSA', accent: '#ee0000' },
  benchmarks: { label: 'BENCHMARKS', accent: '#34d399' },
  'industry-solutions': { label: 'INDUSTRY SOLUTIONS', accent: '#fbbf24' },
  sales: { label: 'SALES', accent: '#f472b6' },
  __root__: { label: 'ENGINEERING PLAYBOOK', accent: '#7aa2f7' },
};

function themeFor(category) {
  return CATEGORY_THEME[category] || CATEGORY_THEME.__root__;
}

// 제목 길이에 따라 폰트 크기를 단계적으로 줄인다(satori는 자동 줄바꿈 지원).
function titleFontSize(title) {
  const len = [...(title || '')].length;
  if (len <= 24) return 68;
  if (len <= 40) return 58;
  if (len <= 60) return 48;
  return 40;
}

// OG 이미지 1장의 satori 트리를 만든다.
function buildTree({ title, category, siteLabel }) {
  const theme = themeFor(category);
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0b1021 0%, #131a35 100%)',
        padding: '64px 72px',
        justifyContent: 'space-between',
        fontFamily: 'Pretendard',
      },
      children: [
        // 상단: 카테고리 라벨 + 좌측 액센트 바
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: 14,
                    height: 44,
                    background: theme.accent,
                    borderRadius: 4,
                    marginRight: 22,
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 30,
                    fontWeight: 600,
                    color: theme.accent,
                    letterSpacing: 2,
                  },
                  children: theme.label,
                },
              },
            ],
          },
        },
        // 중앙: 문서 제목
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: titleFontSize(title),
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.25,
              maxWidth: 1056,
            },
            children: title,
          },
        },
        // 하단: 사이트 도메인
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: 28,
              fontWeight: 400,
              color: '#9aa5ce',
            },
            children: siteLabel,
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
