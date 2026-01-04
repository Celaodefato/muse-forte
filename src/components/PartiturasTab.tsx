import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, FileText, Upload, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SheetMusic {
  id: string;
  name: string;
  file: File;
  url: string;
}

interface PartiturasTabProps {
  sheets: SheetMusic[];
  onAddSheet: (sheet: SheetMusic) => void;
  onRemoveSheet: (id: string) => void;
}

export const PartiturasTab = ({ sheets, onAddSheet, onRemoveSheet }: PartiturasTabProps) => {
  const [selectedSheet, setSelectedSheet] = useState<SheetMusic | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const newSheet: SheetMusic = {
        id: crypto.randomUUID(),
        name: file.name.replace('.pdf', ''),
        file,
        url: URL.createObjectURL(file),
      };
      onAddSheet(newSheet);
      toast.success('Partitura adicionada com sucesso!');
    } else {
      toast.error('Por favor, selecione um arquivo PDF válido.');
    }
    e.target.value = '';
  }, [onAddSheet]);

  const handlePageClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      // Double click - go back
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } else {
      // Single click - go forward
      if (currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    }
    setLastClickTime(now);
  }, [currentPage, totalPages, lastClickTime]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'right' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage, totalPages]);

  if (selectedSheet) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 glass-panel mb-4">
          <Button variant="ghost" onClick={() => setSelectedSheet(null)}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <h2 className="font-display text-lg neon-text">{selectedSheet.name}</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-display">Página {currentPage}/{totalPages}</span>
          </div>
        </div>

        {/* PDF Viewer */}
        <motion.div
          className="flex-1 glass-panel rounded-xl overflow-hidden relative cursor-pointer"
          onClick={handlePageClick}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -100) handleSwipe('left');
            else if (info.offset.x > 100) handleSwipe('right');
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <iframe
              src={`${selectedSheet.url}#page=${currentPage}`}
              className="w-full h-full"
              title={selectedSheet.name}
            />
          </div>

          {/* Navigation hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              2x clique = voltar
            </span>
            <span className="px-2 text-border">|</span>
            <span className="flex items-center gap-1">
              1x clique = avançar
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col gap-6"
    >
      {/* Upload Area */}
      <label className="glass-panel p-8 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all cursor-pointer group hover-glow">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Upload className="w-8 h-8 text-primary animate-pulse-neon" />
          </div>
          <div>
            <p className="font-display text-lg text-foreground">Clique para fazer upload</p>
            <p className="text-muted-foreground text-sm">Apenas arquivos PDF</p>
          </div>
        </div>
      </label>

      {/* Sheet List */}
      <div className="flex-1 overflow-auto">
        <h3 className="font-display text-xl mb-4 neon-text flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Suas Partituras
        </h3>

        {sheets.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma partitura ainda</p>
            <p className="text-sm text-muted-foreground/60">Faça upload do seu primeiro PDF</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {sheets.map((sheet, index) => (
                <motion.div
                  key={sheet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-panel p-4 rounded-xl flex items-center justify-between hover-glow group cursor-pointer"
                  onClick={() => setSelectedSheet(sheet)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{sheet.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSheet(sheet.id);
                      toast.success('Partitura removida');
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
