function e(e,t,n,r){let i=r.slice(0,3).map(e=>`${e.type} session: ${Math.round(e.duration/60)}min, brainrot: ${e.totalBrainrotScore}`).join(`
`),a=n.slice(-6).map(e=>({role:e.role===`assistant`?`model`:`user`,parts:[{text:e.content}]}));return{systemInstruction:{role:`system`,parts:[{text:`You are a focus coach for Study Friction AI. You help users understand and improve their attention habits.

User Profile:
${t}

Recent Activity:
${i||`No recent sessions`}

Rules:
1. Be encouraging but honest
2. Reference the user's actual data when possible
3. Keep responses under 100 words
4. If the user wants to change a setting, include this on a new line at the end:
   ACTION:{"field":"value"}
   Valid actions: {"frictionTolerance":1-5}, {"tone":"strict|balanced|chill"}, {"pomodoroLength":number}, {"goal":"study|work|relax_balance"}
5. Do NOT fabricate data the user doesn't have`}]},contents:[...a,{role:`user`,parts:[{text:e}]}],generationConfig:{maxOutputTokens:200,temperature:.7}}}function t(e){let t=e.split(`
`),n=[],r=[];for(let e of t)if(e.startsWith(`ACTION:`))try{let t=JSON.parse(e.substring(7));n.push(t)}catch{}else r.push(e);return{text:r.join(`
`).trim(),actions:n}}function n(e,t){return{systemInstruction:{role:`system`,parts:[{text:`You are a focus coach summarizing a user's browsing history for a specific category (${t}).
Provide a brief, insightful summary of the content they consumed based on the URLs and titles.

Respond with ONLY valid JSON format. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. The response should start with { and end with }.
{ "summary": "2-3 sentences overview" }`}]},contents:[{role:`user`,parts:[{text:`Links:\n${JSON.stringify(e,null,2)}`}]}],generationConfig:{maxOutputTokens:500,temperature:.5,responseMimeType:`application/json`}}}function r(e){return{systemInstruction:{role:`system`,parts:[{text:`You are a web browsing classifier. Group the following URLs into specific, highly descriptive categories based on their content.
You can create NEW categories that describe the content accurately (e.g., 'E-commerce', 'News', 'Web Development', 'Social Media', 'Health & Fitness', 'Banking', etc.).

Respond with ONLY valid JSON format. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. The response should start with { and end with }.
{
  "classifications": [
    { "url": "https://example.com/...", "category": "category_name" }
  ]
}`}]},contents:[{role:`user`,parts:[{text:`Links to classify:\n${JSON.stringify(e,null,2)}`}]}],generationConfig:{temperature:.2,responseMimeType:`application/json`}}}export{n as i,e as n,t as r,r as t};