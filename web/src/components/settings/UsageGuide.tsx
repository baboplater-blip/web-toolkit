'use client';

import { useState, useCallback } from 'react';
import {
  Monitor,
  MessageSquare,
  CalendarClock,
  Webhook,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FileCode,
  Terminal,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Step {
  text: string;
  note?: string;
}

interface Section {
  key: string;
  icon: typeof Monitor;
  title: string;
  steps?: Step[];
  items?: { icon: typeof Monitor; title: string; description: string }[];
  faqs?: { question: string; answer: string }[];
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const SECTIONS: Section[] = [
  {
    key: 'prerequisites',
    icon: Terminal,
    title: '사전 요구사항',
    steps: [
      {
        text: 'Claude Code가 대상 PC에 설치되어 있어야 합니다.',
        note: 'npm install -g @anthropic-ai/claude-code 또는 공식 설치 방법 사용',
      },
      {
        text: 'Claude Code가 정상 동작하는지 확인합니다.',
        note: '터미널에서 claude --version 실행하여 확인',
      },
      {
        text: 'Node.js 18 이상이 필요합니다.',
        note: '없으면 설치 스크립트가 자동으로 설치합니다',
      },
    ],
  },
  {
    key: 'register',
    icon: Monitor,
    title: 'PC 등록 (새 컴퓨터 추가)',
    steps: [
      { text: '설정 > PC 탭에서 "PC 추가" 버튼을 클릭합니다.' },
      { text: 'PC 이름을 입력합니다.', note: '예: 사무실PC, 거실PC' },
      { text: '생성된 PowerShell 명령어를 복사합니다.' },
      { text: '대상 PC에서 PowerShell을 관리자 권한으로 실행합니다.' },
      {
        text: '명령어를 붙여넣고 실행합니다.',
        note: 'Claude Code는 건드리지 않습니다. ACP 에이전트만 설치되며, 기존 환경에 영향 없음',
      },
      { text: '설치가 완료되면 PC가 "온라인" 상태로 표시됩니다.' },
    ],
  },
  {
    key: 'chat',
    icon: MessageSquare,
    title: '채팅으로 명령 보내기',
    steps: [
      { text: '채팅 탭에서 PC를 선택합니다.', note: '상단 드롭다운' },
      {
        text: '하네스(CLAUDE.md)를 선택합니다.',
        note: '선택사항 — 프로젝트 컨텍스트 제공',
      },
      { text: '메시지를 입력하고 전송합니다.' },
      {
        text: 'Claude Code가 해당 PC에서 명령을 실행하고, 결과를 실시간으로 스트리밍합니다.',
      },
    ],
  },
  {
    key: 'features',
    icon: Zap,
    title: '추가 기능',
    items: [
      {
        icon: CalendarClock,
        title: '예약 실행',
        description:
          '설정 > 예약 탭에서 cron 기반 예약 명령을 등록할 수 있습니다.',
      },
      {
        icon: Webhook,
        title: '웹훅 알림',
        description:
          '설정 > 웹훅 탭에서 Discord/Telegram 알림을 설정할 수 있습니다.',
      },
      {
        icon: FileCode,
        title: '하네스 분석',
        description:
          '설정 > 하네스 탭에서 CLAUDE.md 품질을 분석하고 개선할 수 있습니다.',
      },
    ],
  },
  {
    key: 'faq',
    icon: HelpCircle,
    title: '자주 묻는 질문',
    faqs: [
      {
        question: 'PC가 오프라인으로 표시될 때는?',
        answer:
          '에이전트 프로세스가 실행 중인지 확인하세요. 중단되었다면 설치 폴더의 start.bat을 다시 실행하세요.',
      },
      {
        question: '명령이 실행되지 않을 때는?',
        answer:
          'PC가 온라인 상태인지 확인하세요. 문제가 지속되면 PC 관리 탭의 재시작 버튼을 사용하세요.',
      },
      {
        question: '이미 Claude Code를 쓰고 있는 PC도 등록해야 하나요?',
        answer:
          '네. 이 시스템은 Claude Code 자체가 아닌 원격 제어용 "ACP 에이전트"를 설치합니다. Claude Code는 그대로 유지되며, 에이전트가 웹 명령을 받아 Claude Code를 대신 실행합니다. PC 등록 절차를 동일하게 따르되, Claude Code 재설치는 불필요합니다.',
      },
      {
        question: '여러 PC에 동시에 명령을 보낼 수 있나요?',
        answer:
          '현재는 각 PC에 개별적으로 명령을 전송해야 합니다. 채팅 탭에서 PC를 전환하며 보내세요.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-2.5 pl-1">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {index + 1}
          </span>
          <div className="min-w-0 pt-px">
            <p className="text-sm leading-relaxed">{step.text}</p>
            {step.note && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {step.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function FeatureList({
  items,
}: {
  items: NonNullable<Section['items']>;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="flex gap-3 rounded-lg border bg-background/50 p-3"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FAQList({ faqs }: { faqs: NonNullable<Section['faqs']> }) {
  return (
    <div className="space-y-2.5">
      {faqs.map((faq) => (
        <div key={faq.question} className="rounded-lg border bg-background/50 p-3">
          <p className="text-sm font-medium">{faq.question}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {faq.answer}
          </p>
        </div>
      ))}
    </div>
  );
}

function CollapsibleSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-sm font-semibold">{section.title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t px-4 py-3">
          {section.steps && <StepList steps={section.steps} />}
          {section.items && <FeatureList items={section.items} />}
          {section.faqs && <FAQList faqs={section.faqs} />}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function UsageGuide() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            Claude Code 원격 제어 시스템
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          PC를 등록하고, 웹 채팅으로 원격 PC의 Claude Code에 명령을 보낼 수
          있습니다. 아래 가이드를 펼쳐 각 단계를 확인하세요.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="secondary" className="text-[10px]">
            원격 제어
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            실시간 스트리밍
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            예약 실행
          </Badge>
        </div>
      </div>

      {/* Collapsible sections */}
      {SECTIONS.map((section) => (
        <CollapsibleSection key={section.key} section={section} />
      ))}
    </div>
  );
}
