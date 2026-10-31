import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { X, Check, Copy, Trash2, Plus, Sparkles, Pin } from 'lucide-react';

interface PostItNoteProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'modo_execucao_postit_note_content';

export const PostItNote: React.FC<PostItNoteProps> = ({ isOpen, onClose }) => {
  const { addTask, showToast } = useApp();
  const [content, setContent] = useState(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEY) ||
        '• Ideia rápida ou pensamento para não perder o foco agora:\n• '
      );
    } catch {
      return '';
    }
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, content);
    } catch {
      // ignore
    }
  }, [content]);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(content);
      setCopied(true);
      showToast('Copiado', 'Conteúdo do Post-it copiado para a área de transferência.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Aviso', 'Não foi possível acessar a área de transferência.');
    }
  };

  const handleClear = () => {
    setContent('');
    showToast('Post-it Limpo', 'Anotações apagadas.');
  };

  const handleConvertToTask = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const firstLine = trimmed.split('\n')[0].replace(/^[•\-\*]\s*/, '').trim();
    const taskTitle = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;

    addTask({
      title: taskTitle || 'Ação anotada no Post-it',
      durationMinutes: 15,
      isNextPhysicalAction: true,
      status: 'pronta',
      expectedEvidence: 'Conclusão da anotação do Post-it'
    });

    showToast('Tarefa Criada', `Anotação convertida em tarefa: "${taskTitle}"`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-8 z-50 pointer-events-auto">
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.8, y: 30, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotate: -1.5 }}
          exit={{ opacity: 0, scale: 0.8, y: 20, rotate: 2 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative w-80 sm:w-88 rounded-2xl bg-gradient-to-br from-[#FEF08A] via-[#FDE047] to-[#FACC15] text-[#713F12] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(202,138,4,0.3)] p-4 sm:p-5 border border-yellow-300/80 font-sans cursor-default"
        >
          {/* Top Pin Accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center drop-shadow-md cursor-grab active:cursor-grabbing">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-rose-700 border-2 border-white/80 shadow-md flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
            <div className="w-1 h-2 bg-[#8D9298]" />
          </div>

          {/* Header Row */}
          <div className="flex items-center justify-between pb-2 border-b border-yellow-600/20 mb-3 pt-1">
            <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight text-[#854D0E]">
              <Pin className="w-3.5 h-3.5 rotate-45" />
              <span className="font-mono uppercase text-[11px] tracking-wider font-extrabold">
                Post-it de Foco
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-yellow-600/15 hover:bg-yellow-600/30 text-yellow-950 flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar Post-it"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Post-it Lined Writing Area */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Despeje qualquer pensamento aqui para desocupar a mente..."
              rows={7}
              className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed text-[#713F12] placeholder-[#A16207]/60 font-medium selection:bg-yellow-400 selection:text-[#101114]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(transparent, transparent 27px, rgba(161, 98, 7, 0.15) 28px)',
                lineHeight: '28px',
                paddingTop: '2px'
              }}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-yellow-600/20 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-yellow-600/15 hover:bg-yellow-600/25 text-[#713F12] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                title="Copiar anotações"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg bg-yellow-600/10 hover:bg-yellow-600/20 text-[#854D0E] transition-colors cursor-pointer"
                title="Limpar Post-it"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleConvertToTask}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#854D0E] hover:bg-[#713F12] text-amber-50 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
              title="Transformar primeira linha em tarefa no sistema"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Virar Tarefa</span>
            </button>
          </div>

          {/* Folded Bottom-Right Corner Illusion */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #CA8A04 50%)',
              borderTopLeftRadius: '3px'
            }}
          />
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
