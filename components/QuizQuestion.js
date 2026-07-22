'use client';
import QuestionImage from '@/components/QuestionImage';

const LABELS = ['F1', 'F2', 'F3', 'F4', 'F5'];

// Barcha test sahifalari uchun yagona, yirik savol layouti:
// tepada katta savol banneri, chapda rasm, o'ngda katta javob qatorlari (F1/F2 rangli qutida).
// Ranglar loyiha tokenlaridan (var(--primary) va h.k.) — dizayn o'zgarmaydi.
export default function QuizQuestion({
  q,
  idx,
  total,
  lang = 'uz',
  selected = null,
  correctIdx,
  onSelect,
  onImageClick,
  isSaved = false,
  onToggleSave,
  showFeedback = true,
}) {
  if (!q) return null;
  const cIdx = correctIdx ?? q.variants.findIndex(v => v.is_correct);

  return (
    <div className="quiz-card">
      {/* Savol banneri */}
      <div className="quiz-banner">
        <p className="quiz-banner-text">{q.text?.[lang] || q.text?.uz}</p>
        <div className="quiz-banner-side">
          {typeof idx === 'number' && typeof total === 'number' && (
            <span className="quiz-banner-count"><strong>{idx + 1}</strong> / {total}</span>
          )}
          {onToggleSave && (
            <button type="button" onClick={() => onToggleSave(q.id)} className="quiz-save-btn"
              style={{ color: isSaved ? '#F59E0B' : 'rgba(255,255,255,0.85)' }} aria-label="Saqlash">
              🔖
            </button>
          )}
        </div>
      </div>

      {/* Body: chap rasm — o'ng javoblar */}
      <div className="quiz-body">
        {q.image_url && (
          <div className="quiz-image">
            <QuestionImage src={q.image_url} maxHeight={420} onClick={onImageClick} />
          </div>
        )}

        <div className="quiz-answers">
          {q.variants.map((v, i) => {
            let cls = 'quiz-answer';
            if (showFeedback && selected !== null) {
              if (i === cIdx) cls += ' is-correct';
              else if (i === selected) cls += ' is-wrong';
            }
            return (
              <button key={i} className={cls} onClick={() => onSelect?.(i)} disabled={selected !== null}>
                <span className="quiz-flabel">{LABELS[i]}</span>
                <span className="quiz-answer-text">{v.text?.[lang] || v.text?.uz}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
