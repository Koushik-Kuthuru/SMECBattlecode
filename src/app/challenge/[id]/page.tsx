
"use client";
import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import { app, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, Timestamp, runTransaction, increment } from "firebase/firestore";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import type { Challenge } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCcw, Code, Loader2, Bug, Play, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChallenge } from "../layout";

export default function ChallengeDetail() {
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
  const [initialSolution, setInitialSolution] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const params = useParams();
  const challengeId = params.id as string;
  
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!challenge) return;
    const availableLangs = challenge.languages || [];
    const firstLang = availableLangs.length > 0 ? availableLangs[0] : 'Python';
    if(language === null) {
      setLanguage(firstLang);
    }

    const fetchSolution = async () => {
      let userCode = (challenge.starterCode && challenge.starterCode[language || firstLang]) || '';

      if (user && language) {
        const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
        const solSnap = await getDoc(solRef);
        if (solSnap.exists() && solSnap.data().language === language) {
          userCode = solSnap.data().code;
        } else if (challenge.starterCode) {
           userCode = challenge.starterCode[language] || '';
        }
      }
      setSolution(userCode || '');
      setInitialSolution(userCode || '');
    };

    fetchSolution();
  }, [challenge, user, language, setLanguage, setSolution]);


  const handleSave = async () => {
    if (!user || !challenge || !language) {
       toast({ variant: "destructive", title: "Error", description: "You must be logged in to save your progress." });
       return;
    }
    setIsSaving(true);
    try {
        const solRef = doc(db, `users/${user.uid}/solutions`, challenge.id!);
        await setDoc(solRef, { code: solution || '', language, updatedAt: new Date() }, { merge: true });
        
        const inProgressRef = doc(db, `users/${user.uid}/challengeData`, 'inProgress');
        await setDoc(inProgressRef, { [challenge.id!]: true }, { merge: true });
        
        toast({ title: "Progress Saved!", description: "Your code has been saved successfully." });
        
        setInitialSolution(solution || '');
    } catch (error) {
        console.error("Failed to save solution:", error);
         toast({ variant: "destructive", title: "Save Failed", description: "Could not save your code. Please try again." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleReset = () => {
      if(window.confirm("Are you sure you want to reset your code to your last saved version?")) {
          setSolution(initialSolution);
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
           <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={isSaving || isRunning || isSubmitting}>
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save
           </Button>
         </div>
       </div>
       <div className="flex-grow relative bg-white pr-[2px]">
            <CodeEditor
                value={solution}
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
