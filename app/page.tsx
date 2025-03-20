'use client';
import ChatInterface from '@/components/ChatInterface';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  console.log("isExpanded state in Page.tsx:", isEditorOpen);

  return (
    <div className="min-h-screen bg-indigo-950/90">
      <div className="relative w-full h-screen">
        <div className='w-full flex flex-col justify-center items-center'>
          <motion.h1 className="relative text-3xl font-bold text-blue-500 text-center mb-8"
          style={{ width: '40vw' }}
          animate={isEditorOpen ? { left: '-29vw', width: '59vw' } : { left: '0vw' }}
          transition={{ type: 'spring', stiffness: 100 }}
          >
            AI Consultant Chat

          </motion.h1>
        </div>
        <ChatInterface isEditorOpen={isEditorOpen} setIsEditorOpen={setIsEditorOpen}/>
      </div>
    </div>
  );
}

