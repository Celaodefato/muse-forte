import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, FileText, Upload, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
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
      toast.success('Partitura adicionada!');
    } else {
      toast.error('Selecione um arquivo PDF válido');
    }
    e.target.value = '';
  }, [onAddSheet]);

  const handlePageClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } else {
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
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedSheet(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <span className="text-sm text-muted-foreground font-medium">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* PDF Viewer */}
        <motion.div
          className="flex-1 glass-panel overflow-hidden relative cursor-pointer"
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
              className="w-full h-full rounded-xl"
              title={selectedSheet.name}
            />
          </div>

          {/* Navigation hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-2">
            <p className="text-xs text-muted-foreground flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> 2x clique
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                1x clique <ChevronRight className="w-3 h-3" />
              </span>
            </p>
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
      <label className="glass-panel p-6 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all cursor-pointer group hover-lift">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Adicionar partitura</p>
            <p className="text-muted-foreground text-sm">Clique para fazer upload (PDF)</p>
          </div>
        </div>
      </label>

      {/* Sheet List */}
      <div className="flex-1 overflow-auto">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Biblioteca
        </h3>

        {sheets.length === 0 ? (
          <div className="glass-panel p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Music className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">Nenhuma partitura</p>
            <p className="text-sm text-muted-foreground">Faça upload do seu primeiro PDF</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {sheets.map((sheet, index) => (
                <motion.div
                  key={sheet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-panel p-4 flex items-center justify-between hover-lift group cursor-pointer"
                  onClick={() => setSelectedSheet(sheet)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{sheet.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSheet(sheet.id);
                      toast.success('Partitura removida');
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
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
