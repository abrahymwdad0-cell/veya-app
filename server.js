import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({limit:'2mb'}));
app.use(express.static('.'));

app.post('/api/chat', async (req,res)=>{
  try {
    const {character={}, message='', history=[]}=req.body||{};
    if(!message.trim()) return res.status(400).json({error:'Empty message'});
    if(!process.env.GEMINI_API_KEY) return res.status(500).json({error:'GEMINI_API_KEY is not configured'});
    const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
    const system = `You are ${character.name||'the character'} in a private character-chat app called Veya. Stay in character and respond naturally.
Character description: ${character.description||''}
Story/background: ${character.story||''}
Relationship with the user: ${character.relationship||''}
Relationship dynamics: ${character.dynamics||''}
Important details to remember: ${character.details||''}
Memory: ${(character.memory||[]).join(' | ')}
Use affectionate nicknames naturally when appropriate. Vary them based on mood, context, and relationship development; never force a nickname every message.
Keep replies concise but immersive. Usually write 3–5 sentences, with natural dialogue, short actions, and reactions. Avoid long paragraphs, repetition, and unnecessary explanations. Make replies longer only when the scene genuinely requires it.`;
    const contents = (Array.isArray(history)?history:[]).slice(-18).map(m=>({role:m.role==='ai'?'model':'user',parts:[{text:String(m.text||'')}]}));
    contents.push({role:'user',parts:[{text:message.trim()}]});
    const result = await ai.models.generateContent({model:'gemini-2.5-flash',contents,config:{systemInstruction:system,maxOutputTokens:420,temperature:0.9}});
    res.json({reply:result.text||'I’m here.'});
  } catch (e) {
    console.error(e);
    res.status(500).json({error:e?.message||'AI request failed'});
  }
});

app.get('/health',(req,res)=>res.json({ok:true,app:'Veya'}));
const port=process.env.PORT||3000;
app.listen(port,'0.0.0.0',()=>console.log(`Veya listening on ${port}`));
