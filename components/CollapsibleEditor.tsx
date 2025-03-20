'use client';

import { motion } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileContent {
  name: string;
  content: string;
  language: string;
}

interface CollapsibleEditorProps {
  files: FileContent[];
  onClose: () => void;
}

export default function CollapsibleEditor({ files, onClose }: CollapsibleEditorProps) {
  const [activeTab, setActiveTab] = useState(files[0]?.name);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const handleCopy = async (content: string, fileName: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedStates(prev => ({ ...prev, [fileName]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [fileName]: false }));
    }, 2000);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '55%',
        height: '100%',
        zIndex: 50
      }}
      className="bg-gray-900 border-l border-gray-700/50 shadow-xl"
    >
      {/* Additional Close Button (Top Left) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute top-4 left-4 z-50"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-gray-800/80 hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
      </motion.div>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-200 ml-14">Code Editor</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-gray-700/50">
              <TabsList className="bg-gray-800/50">
                {files.map((file) => (
                  <TabsTrigger
                    key={file.name}
                    value={file.name}
                    className="data-[state=active]:bg-blue-700/80"
                  >
                    {file.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {files.map((file) => (
              <TabsContent
                key={file.name}
                value={file.name}
                className="h-[calc(100vh-8rem)] overflow-auto relative mt-0 p-4"
              >
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(file.content, file.name)}
                    className="bg-gray-700/80 hover:bg-blue-700/80"
                  >
                    {copiedStates[file.name] ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedStates[file.name] ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <SyntaxHighlighter
                  language={file.language}
                  style={nightOwl}
                  className="!mt-0 !bg-transparent scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
                >   
                  {file.content}
                </SyntaxHighlighter>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}