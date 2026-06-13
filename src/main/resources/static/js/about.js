// CURSOR
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx=0, my=0, rx=0, ry=0;
document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    cursor.style.left=mx+'px'; cursor.style.top=my+'px';
});
(function animateRing(){
    rx+=(mx-rx)*.15; ry+=(my-ry)*.15;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(animateRing);
})();
document.addEventListener('mouseover', e => {
    if(e.target.closest('button,a,[onclick]')) document.body.classList.add('hovering');
});
document.addEventListener('mouseout', e => {
    if(e.target.closest('button,a,[onclick]')) document.body.classList.remove('hovering');
});

// SCROLL REVEAL
function initReveal() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        if(el.getBoundingClientRect().top < window.innerHeight - 80) el.classList.add('visible');
    });
}
window.addEventListener('scroll', initReveal);
setTimeout(initReveal, 200);

// POLICY TABS
function switchPolicy(id, btn) {
    document.querySelectorAll('.policy-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.policy-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('policy-' + id).classList.add('active');
    btn.classList.add('active');
    // re-trigger reveal for new content
    setTimeout(initReveal, 50);
}

async function loadAboutMembers() {
    try {
        const response = await fetch('/users/abouts');
        const members = await response.json();
        const teamGrid = document.getElementById('teamGrid');
        teamGrid.innerHTML = '';
        members.forEach((member, index) => {
            const avatar = member.fullName
                .trim()
                .split(' ')
                .pop()
                .charAt(0)
                .toUpperCase();
            teamGrid.innerHTML += `
                <div class="team-card reveal">
                    <div class="team-avatar">${avatar}</div>
                    <div class="team-name">${member.fullName}</div>
                    <div class="team-role">${member.position}</div>
                </div>
            `;
        });

    } catch (error) {
        console.error('Lỗi tải đội ngũ sáng lập:', error);
    }
}
document.addEventListener('DOMContentLoaded', loadAboutMembers);

window.switchPolicy =switchPolicy;