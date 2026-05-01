import { useState } from 'react';
import { Task } from '../index';

export function useSmartInput(apiUrl: string) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedTask, setParsedTask] = useState<Partial<Task> | null>(null);

  const parseCommand = async (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setParsedTask(null);

    try {
      const response = await fetch(`${apiUrl}/ai/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse command');
      }

      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setParsedTask(result.data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while parsing the command');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
  };

  const submitCommand = () => {
    parseCommand(inputText);
  };

  const reset = () => {
    setInputText('');
    setParsedTask(null);
    setError(null);
  };

  return {
    inputText,
    handleInputChange,
    submitCommand,
    isLoading,
    error,
    parsedTask,
    reset
  };
}
