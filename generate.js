const fs = require('fs');

try {
  // 1. CSV 파일 읽기
  let rawContent = fs.readFileSync('./_data/list.csv');
  
  // 보이지 않는 특수 기호(BOM) 제거 처리
  if (rawContent[0] === 0xEF && rawContent[1] === 0xBB && rawContent[2] === 0xBF) {
    rawContent = rawContent.slice(3);
  }

  let csv = rawContent.toString('utf-8');
  const rows = csv.split(/\r?\n/).filter(line => line.trim() !== '');

  if (rows.length === 0) {
    console.error('에러: CSV 파일에 데이터가 없습니다.');
    process.exit(1);
  }

  // 2. 첫 번째 줄(헤더) 분석
  // 쉼표뿐만 아니라 세미콜론(;) 등으로 구분된 경우도 처리하기 위해 더 유연하게 나눕니다.
  const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));

  // 찾으려는 컬럼 후보들
  const nameKeywords = ['이름', '연예인', '인물', 'name', 'celeb'];
  const nameIdx = headers.findIndex(h => 
    nameKeywords.some(key => h.toLowerCase().includes(key))
  );

  if (nameIdx === -1) {
    console.log('--------------------------------------------------');
    console.log('에러: 이름 컬럼을 찾을 수 없습니다.');
    console.log('인식된 컬럼 목록:', headers);
    console.log('팁: 엑셀에서 [다른 이름으로 저장] -> [CSV UTF-8]로 저장했는지 확인하세요.');
    console.log('--------------------------------------------------');
    process.exit(1);
  }

  // 3. 중복 없는 이름 추출
  const celebs = new Set();
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(',');
    if (cols[nameIdx]) {
      const name = cols[nameIdx].replace(/["\r]/g, '').trim();
      // 이름이 깨진 상태(???)로 들어오는 것을 방지하기 위해 한글/영문 포함 여부 체크 가능
      if (name && name.length > 0) {
        celebs.add(name);
      }
    }
  }

  // 4. _celebs 폴더 생성 및 파일 쓰기
  if (!fs.existsSync('./_celebs')) {
    fs.mkdirSync('./_celebs');
  }

  // 기존 파일 삭제 (데이터 동기화용)
  const files = fs.readdirSync('./_celebs');
  for (const file of files) {
    fs.unlinkSync(`./_celebs/${file}`);
  }

  celebs.forEach(name => {
    const safeFileName = name.replace(/[\\/:*?"<>|]/g, '');
    const content = `---\ntitle: ${name}\nlayout: celeb\n---\n`;
    fs.writeFileSync(`./_celebs/${safeFileName}.md`, content, 'utf-8');
  });

  console.log('--------------------------------------------------');
  console.log(`성공: 총 ${celebs.size}명의 개별 문서가 생성되었습니다 .`);
  console.log('위치: ./_celebs/ 폴더를 확인하세요.');
  console.log('--------------------------------------------------');

} catch (err) {
  console.error('스크립트 실행 중 오류 발생:', err.message);
}