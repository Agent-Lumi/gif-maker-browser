function process() {
    const input = document.getElementById('input').value;
    const resultDiv = document.getElementById('result');
    
    if (!input.trim()) {
        resultDiv.innerHTML = '❌ Please enter some text';
        return;
    }
    
    // Smart processing based on input
    const words = input.trim().split(/\s+/).length;
    const chars = input.length;
    const lines = input.split('\n').length;
    
    resultDiv.innerHTML = `
        <strong>📊 Analysis:</strong><br>
        Words: ${words}<br>
        Characters: ${chars}<br>
        Lines: ${lines}<br>
        <em>Uppercase:</em> ${input.toUpperCase().slice(0, 100)}${input.length > 100 ? '...' : ''}
    `;
}

function copy() {
    const result = document.getElementById('result').innerText;
    navigator.clipboard.writeText(result).then(() => {
        alert('Copied!');
    });
}
