'use client';

import { FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface FileButtonProps {
  fileName: string;
  language: string;
  onClick: () => void;
}

export default function FileButton({ fileName, language, onClick }: FileButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Button
        variant="outline"
        className="bg-gray-800/80 border-gray-700/50 hover:bg-blue-700/80 hover:border-gray-600/50 text-gray-200"
        onClick={onClick}
      >
        <FileCode className="w-4 h-4 mr-2 text-blue-400" />
        <span className="mr-2">{fileName}</span>
        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
          {language}
        </span>
      </Button>
    </motion.div>
  );
}
