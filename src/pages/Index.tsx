import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Music2 } from 'lucide-react';
import { PartiturasTab } from '@/components/PartiturasTab';
import { CifrasTab } from '@/components/CifrasTab';

type Tab = 'partituras' | 'cifras';

interface SheetMusic {
  id: string;
  name: string;
  file: File;
  url: string;
}

interface Cifra {
  id: string;
  name: string;
  lyrics: string;
  chords: string;
  status: 'processing' | 'completed' | 'error';
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('partituras');
  const [sheets, setSheets] = useState<SheetMusic[]>([]);
  const [cifras, setCifras] = useState<Cifra[]>([]);

  const handleAddSheet = (sheet: SheetMusic) => {
    setSheets(prev => [...prev, sheet]);
  };

  const handleRemoveSheet = (id: string) => {
    setSheets(prev => prev.filter(s => s.id !== id));
  };

  const handleAddCifra = (cifra: Cifra) => {
    setCifras(prev => {
      const existing = prev.findIndex(c => c.id === cifra.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = cifra;
        return updated;
      }
      return [...prev, cifra];
    });
  };

  const handleRemoveCifra = (id: string) => {
    setCifras(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">MF</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Music Folio
          </h1>
          <p className="text-muted-foreground text-sm">
            Suas partituras e cifras em um só lugar
          </p>
        </motion.header>

        {/* Tab Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-1.5 mb-8"
        >
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('partituras')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'partituras'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Partituras
            </button>
            <button
              onClick={() => setActiveTab('cifras')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === 'cifras'
                  ? 'bg-secondary text-secondary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Music2 className="w-4 h-4" />
              Cifras
            </button>
          </div>
        </motion.nav>

        {/* Tab Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'partituras' ? (
              <PartiturasTab
                key="partituras"
                sheets={sheets}
                onAddSheet={handleAddSheet}
                onRemoveSheet={handleRemoveSheet}
              />
            ) : (
              <CifrasTab
                key="cifras"
                cifras={cifras}
                onAddCifra={handleAddCifra}
                onRemoveCifra={handleRemoveCifra}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;
