import React from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang} from './shared';
import styles from './MethodFlow.module.css';

// All numbers come from data.method; this component invents none of them.
const M = data.method;

// Component-specific copy. Kept local (like SameModelChart) rather than added to
// the shared string table, because these strings belong only to this diagram.
const LABELS = {
  ko: {
    title: '측정 방식 한눈에 보기',
    desc: '한 번의 실행은 빌더·검증자·채점을 반복하며, 두 조건을 모두 만족하면 완주로 판정합니다.',
    // Band a
    taskHeading: '과제와 완주 조건',
    taskCard: 'RealWorld 백엔드',
    stackLabel: '기술 스택',
    scopeLabel: '구현 범위',
    completionLabel: '완주 조건 (둘 다 충족)',
    cond1: '빌더가 .ralph-done 생성',
    cond2: `공식 Hurl 채점 통과 (${M.grader.hurl_files}개 파일 · 요청 ${M.grader.requests}개)`,
    taskNote: '채점에 실패하면 .ralph-done을 지우고 다음 반복',
    // Band b
    loopHeading: '한 번의 Ralph 루프 반복',
    steps: [
      {name: '빌더', sub: 'PROMPT-en.md로 구현, 2회차부터 REVIEW.md 먼저 읽기'},
      {name: '검증자', sub: 'Hurl 테스트를 직접 실행하고 REVIEW.md 작성, 다른 파일은 수정 안 함'},
      {name: '채점', sub: `공식 Hurl 테스트 ${M.grader.hurl_files}개 파일·요청 ${M.grader.requests}개로 완주 판정`},
    ],
    loopBack: '미완주 → 다음 반복(새 세션, 저장소만 이어짐)',
    loopCaption: '빌더와 검증자는 같은 모델',
    // Band c
    guardHeading: '실행 가드레일',
    guardrails: [
      `반복 상한 ${M.limits.iterations_max}회`,
      `run 시간 상한 ${Math.round(M.limits.run_cap_sec / 60)}분`,
      `멈춤 감지 ${M.limits.stall_sec}초`,
      `비용 한도 run $${M.limits.cost_cap_usd.run} · 모델 $${M.limits.cost_cap_usd.model} · 전체 $${M.limits.cost_cap_usd.total.toLocaleString('en-US')}`,
      `격리: 에이전트 세션·채점마다 Docker 컨테이너 1개 (${M.container.mem_gb} GB, ${M.container.cpus} CPU, ${M.container.pids.toLocaleString('en-US')} 프로세스)`,
      `자격 증명: Bedrock 전용 단기 API 키, 최대 ${M.credentials.token_ttl_min}분, ${M.credentials.refresh_min}분마다 갱신, 컨테이너에 AWS 액세스 키 없음`,
      `실행: 최대 ${M.limits.parallel_models}개 모델 병렬, 한 모델의 ${M.limits.runs_per_model}회 실행은 순차`,
      `하네스: ${M.harness.agent} ${M.harness.version} · ${M.harness.api} · thinking ${M.harness.thinking} · 영어 프롬프트`,
    ],
    srcPre: '과제·채점 기준: RealWorld 명세와 공개 Hurl 테스트 \u00b7 실행 설정: 이 보고서',
    srcLink: '공개 저장소',
    and: '그리고',
  },
  en: {
    title: 'How each run works',
    desc: 'One run repeats builder, verifier and grader; a run counts as complete only when both conditions hold.',
    taskHeading: 'Task and completion rule',
    taskCard: 'RealWorld backend',
    stackLabel: 'Stack',
    scopeLabel: 'Scope',
    completionLabel: 'Completion (both must hold)',
    cond1: 'Builder creates .ralph-done',
    cond2: `Official Hurl grader: all ${M.grader.hurl_files} files, ${M.grader.requests} requests`,
    taskNote: 'If grading fails, the harness deletes .ralph-done and runs another iteration',
    loopHeading: 'One Ralph-loop iteration',
    steps: [
      {name: 'Builder', sub: 'Implements from PROMPT-en.md; from iteration 2 it reads REVIEW.md first'},
      {name: 'Verifier', sub: 'Runs the Hurl tests itself and writes REVIEW.md; edits nothing else'},
      {name: 'Grader', sub: `Decides completion with the official Hurl tests (${M.grader.hurl_files} files, ${M.grader.requests} requests)`},
    ],
    loopBack: 'Not complete \u2192 next iteration (new session; only the repository carries over)',
    loopCaption: 'Builder and verifier use the same model',
    guardHeading: 'Guardrails',
    guardrails: [
      `Iterations max ${M.limits.iterations_max}`,
      `Run cap ${Math.round(M.limits.run_cap_sec / 60)} min`,
      `Stall watchdog ${M.limits.stall_sec} s`,
      `Cost caps: run $${M.limits.cost_cap_usd.run} \u00b7 model $${M.limits.cost_cap_usd.model} \u00b7 total $${M.limits.cost_cap_usd.total.toLocaleString('en-US')}`,
      `Isolation: one Docker container per agent session and per grading pass (${M.container.mem_gb} GB, ${M.container.cpus} CPU, ${M.container.pids.toLocaleString('en-US')} processes)`,
      `Credentials: Bedrock-only short-term API key, max ${M.credentials.token_ttl_min} min, refreshed every ${M.credentials.refresh_min} min, no AWS access keys in containers`,
      `Execution: up to ${M.limits.parallel_models} models in parallel; the ${M.limits.runs_per_model} runs of one model in sequence`,
      `Harness: ${M.harness.agent} ${M.harness.version} \u00b7 ${M.harness.api} \u00b7 thinking ${M.harness.thinking} \u00b7 English prompts`,
    ],
    srcPre: 'Task and grading: the RealWorld specification and the public Hurl tests \u00b7 run settings: this report',
    srcLink: 'public repository',
    and: 'AND',
  },
};

// Scope keys localized per the task spec (fixed mapping, not from data).
const SCOPE_LABELS = {
  ko: {auth: '인증', users: '사용자\u00b7프로필', articles: '글', comments: '댓글',
    favorites: '즐겨찾기', tags: '태그', feed: '피드'},
  en: {auth: 'Auth', users: 'Users & profiles', articles: 'Articles', comments: 'Comments',
    favorites: 'Favorites', tags: 'Tags', feed: 'Feed'},
};

export default function RalphMethodFlow() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const scopeMap = SCOPE_LABELS[lang] || SCOPE_LABELS.en;

  const source = lang === 'ko'
    ? <>{L.srcPre} (<a href={data.reference.repo}>{L.srcLink}</a>)</>
    : <>{L.srcPre} (<a href={data.reference.repo}>{L.srcLink}</a>)</>;

  return (
    <Figure title={L.title} description={L.desc} source={source}>
      <div className={styles.diagram}>

        {/* Band a: task and completion rule */}
        <section className={styles.band} aria-label={L.taskHeading}>
          <div className={styles.bandHeading}>{L.taskHeading}</div>
          <div className={styles.taskCard}>
            <div className={styles.taskName}>{L.taskCard}</div>
            <div className={styles.chipRow}>
              <span className={styles.chipLabel}>{L.stackLabel}</span>
              {M.task.stack.map((s) => (
                <span key={s} className={styles.chip}>{s}</span>
              ))}
            </div>
            <div className={styles.chipRow}>
              <span className={styles.chipLabel}>{L.scopeLabel}</span>
              {M.task.scope.map((s) => (
                <span key={s} className={styles.chip}>{scopeMap[s] || s}</span>
              ))}
            </div>
          </div>
          <div className={styles.completion}>
            <div className={styles.completionLabel}>{L.completionLabel}</div>
            <div className={styles.completionRow}>
              <span className={styles.badge}>{L.cond1}</span>
              <span className={styles.andText}>{L.and}</span>
              <span className={styles.badge}>{L.cond2}</span>
            </div>
          </div>
          <p className={styles.note}>{L.taskNote}</p>
        </section>

        {/* Band b: one iteration as an ordered flow */}
        <section className={styles.band} aria-label={L.loopHeading}>
          <div className={styles.bandHeading}>{L.loopHeading}</div>
          <ol className={styles.flow}>
            {L.steps.map((step, i) => (
              <li key={step.name} className={styles.step}>
                <div className={styles.stepCard}>
                  <div className={styles.stepName}>{step.name}</div>
                  <div className={styles.stepSub}>{step.sub}</div>
                </div>
                {i < L.steps.length - 1 && (
                  <span className={styles.arrow} aria-hidden="true">&#8594;</span>
                )}
              </li>
            ))}
          </ol>
          <p className={styles.loopBack}>
            {/* Inline icon: the arrow glyphs U+21B6/U+21BB are missing from some system fonts. */}
            <svg className={styles.loopArrow} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 4v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {L.loopBack}
          </p>
          <p className={styles.caption}>{L.loopCaption}</p>
        </section>

        {/* Band c: guardrails */}
        <section className={styles.band} aria-label={L.guardHeading}>
          <div className={styles.bandHeading}>{L.guardHeading}</div>
          <ul className={styles.guardList}>
            {L.guardrails.map((g, i) => (
              <li key={i} className={styles.guardChip}>{g}</li>
            ))}
          </ul>
        </section>

      </div>
    </Figure>
  );
}
