
"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { app, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import type { Challenge } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCcw, Code, Loader2, Bug, Play, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChallenge } from "../layout";

export default function ChallengeWorkspace({ contestId }: { contestId: string }) {
  const {
    challenge,
    runResult,
    debugOutput,
    isRunning,
    isResultsPanelFolded,
    setIsResultsPanelFolded,
    solution,
    setSolution,
    language,
    setLanguage,
    setActiveTab,
    handleRunCode,
    handleDebugCode,
    handleSubmit,
    isSubmitting,
  } = useChallenge();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [allSolutions, setAllSolutions] = useState<Record<string, string>>({});

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!challenge || !user) return;

    const fetchAllSolutions = async () => {
      const solRef = doc(db, `users/${user.uid}/virtual_solutions/${contestId}`, challenge.id!);
      const solSnap = await getDoc(solRef);
      if (solSnap.exists()) {
        setAllSolutions(solSnap.data().codeByLang || {});
      }
    };
    fetchAllSolutions();
  }, [challenge, user, contestId]);

  useEffect(() => {
    if (!challenge) return;

    const availableLangs = challenge.languages || [];
    const currentLang = language || availableLangs[0] || 'Python';

    if (!language) {
      setLanguage(currentLang);
    }
    
    const savedCode = allSolutions[currentLang];
    const starterCode = (challenge.starterCode && challenge.starterCode[currentLang]) || '';
    setSolution(savedCode || starterCode);

  }, [challenge, language, allSolutions, setLanguage, setSolution]);


  const autoSave = useCallback(async () => {
    if (!user || !challenge || !language || isSaving || solution === undefined) {
      return;
    }
    setIsSaving(true);
    
    const currentSavedCode = allSolutions[language] || (challenge.starterCode && challenge.starterCode[language]) || '';
    if (solution === currentSavedCode) {
        setIsSaving(false);
        return;
    }

    try {
      const solRef = doc(db, `users/${user.uid}/virtual_solutions/${contestId}`, challenge.id!);
      await setDoc(solRef, { 
          codeByLang: { [language]: solution },
          updatedAt: serverTimestamp() 
      }, { merge: true });
      
      setAllSolutions(prev => ({...prev, [language]: solution}));

      toast({ title: "Virtual Battle Progress Saved!", description: `Your ${language} code has been saved.` });

    } catch (error) {
      console.error("Failed to auto-save virtual solution:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your code." });
    } finally {
      setIsSaving(false);
    }
  }, [user, challenge, language, solution, allSolutions, isSaving, contestId, toast]);


  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [solution, language, autoSave]);


  const handleReset = () => {
      if(window.confirm("Are you sure you want to reset your code to the original starter code for this language?")) {
          if (challenge && language && challenge.starterCode) {
              setSolution(challenge.starterCode[language] || '');
          }
      }
  };
  
  const availableLanguages = challenge?.languages || [];
  
  return (
    <div className="h-full w-full flex flex-col bg-background">
       <div className="flex-shrink-0 p-2 flex justify-between items-center border-b bg-muted">
         <Select value={language || ''} onValueChange={(lang) => setLanguage(lang)} disabled={availableLanguages.length <= 1}>
             <SelectTrigger className="w-[180px]">
                 <SelectValue placeholder="Select language" />
             </SelectTrigger>
             <SelectContent>
                {availableLanguages.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
             </SelectContent>
         </Select>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving || isRunning || isSubmitting}>
             <RefreshCcw className="mr-2 h-4 w-4" /> Reset
           </Button>
           {isSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                </div>
            )}
         </div>
       </div>
       <div className="flex-grow relative bg-white pr-[2px]">
            <CodeEditor
                value={solution || ''}
                onChange={setSolution}
                language={(language || '').toLowerCase()}
            />
       </div>
        <footer className="shrink-0 flex items-center justify-between p-2 border-t bg-muted gap-2">
            <div>
                 {(isRunning || runResult || debugOutput) && (
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsResultsPanelFolded(!isResultsPanelFolded)}>
                        {isResultsPanelFolded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                 )}
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-orange-500 border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-600" onClick={() => setActiveTab('debug')} disabled={isSaving || isRunning || isSubmitting}>
                    <Bug className="mr-2 h-4 w-4" /> Debug
                </Button>
                 <Button size="sm" variant="secondary" onClick={handleRunCode} disabled={isSaving || isRunning || isSubmitting}>
                    {isRunning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />} Run
                </Button>
                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSaving || isRunning || isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null} Submit
                </Button>
            </div>
        </footer>
    </div>
  );
}
