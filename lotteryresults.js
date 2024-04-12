// Define the API URL
let tableElement;
let tableHeader;
let tableBody;

window.onload = function() {

  tableElement = document.getElementById("lotteryTable");
  tableHeader = document.getElementById("tableheader");
  tableBody = document.getElementById("tablebody");

  submitBtn = document.getElementById("submitBtn");
  console.log(!!submitBtn);
  submitBtn.addEventListener("click", getLotteryData);
  initializeTable();
  getLotteryData();
}

function initializeTable(){
  headerHtml = '<th>Date</th>';
  for (let i = 1; i < 81; i++) {
    headerHtml += `<th>${i}</th>`
  }
  tableHeader.innerHTML = headerHtml;
}

function getLotteryData() {
  urlParams = new URLSearchParams(window.location.search);
  startDate = null;
  endDate = null;
  if (urlParams.size > 0) {
    startDate = urlParams.get("startDate");
    endDate = urlParams.get("endDate");
  }
  if (!!startDate && !!endDate) {
    let apiUrl = `https://data.ny.gov/resource/bycu-cw7c.json?$where=draw_date between '${startDate}T00:00:00' and '${endDate}T00:00:00'`;

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log(data);
        updateTable(data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}

function updateTable(data) {
  tableBodyHtml = '';
  for (let dateData of data.reverse()) {
    rowHtml = '<tr>';
    rowHtml += `<th>${dateData['draw_date'].split('T')[0]}</th>`
    numbersSet = new Set(dateData['winning_numbers'].split(' ').map(num => Number(num)));
    for (let i = 1; i < 81; i++) {
      rowHtml += `<td>${numbersSet.has(i) ? i : ''}</td>`
    }
    rowHtml += '</tr>';
    tableBodyHtml += rowHtml;
  }
  tableBody.innerHTML = tableBodyHtml;
}