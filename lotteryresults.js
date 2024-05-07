// Define the API URL
let tableElement;
let tableHeader;
let tableBody;
let freqTableElement;
let freqTableHeader;
let freqTableBody;
let startDateInput;
let endDateInput;
let groupInput;
let highlightedGroup;
let queryData;
let frequentCombos = []

window.onload = function() {

  tableElement = document.getElementById("lotteryTable");
  tableHeader = document.getElementById("tableheader");
  tableBody = document.getElementById("tablebody");
  freqTableElement = document.getElementById("frequencytable");
  freqTableHeader = document.getElementById("freqtableheader");
  freqTableBody = document.getElementById("freqtablebody");
  startDateInput = document.getElementById("startDate");
  endDateInput = document.getElementById("endDate");
  groupInput = document.getElementById("groupSize");

  submitBtn = document.getElementById("submitBtn");
  console.log(!!submitBtn);
  submitBtn.addEventListener("click", getLotteryData);
  initializeTable();
  getLotteryData();
}

function initializeTable(){
  headerHtml = '<th>Date</th>'
  for (let i = 1; i <= 80; i++) {
    headerHtml += `<th>${i}</th>`
  }
  tableHeader.innerHTML = headerHtml;

  freqHeaderHtml = '<th>Group</th><th>Count</th><th>Dates</th>';
  freqTableHeader.innerHTML = freqHeaderHtml;
}

function getLotteryData() {
  urlParams = new URLSearchParams(window.location.search);
  startDate = null;
  endDate = null;
  comboSize = 0;
  if (urlParams.size > 0) {
    startDate = urlParams.get("startDate");
    endDate = urlParams.get("endDate");
    comboSize = urlParams.get("groupSize");
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
        // console.log(data);
        updateInputFields(startDate, endDate, comboSize);
        updateTable(data, comboSize);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
}

function updateInputFields(startDate, endDate, groupSize) {
  startDateInput.value = startDate;
  endDateInput.value = endDate;
  groupInput.value = groupSize;
}

function updateTable(data, comboSize) {
  winningNumberLists = [];
  queryData = data;

  tableBodyHtml = '';
  data.reverse();
  for (let dateData of data) {
    date = dateData['draw_date'].split('T')[0];
    rowHtml = `<tr id=${date}>`;
    rowHtml += `<th>${date}</th>`
    dateData['winning_numbers'] = dateData['winning_numbers'].split(' ').map(num => Number(num));
    let numberSet = new Set(dateData['winning_numbers']);
    for (let i = 1; i <= 80; i++) {
      if (numberSet.has(i)) {
      rowHtml += `<td>${i}</td>`;
      } else {
        rowHtml+= '<td></td>';
      }
    }
    rowHtml += '</tr>';
    tableBodyHtml += rowHtml;
    if (!!comboSize) {
      winningNumberLists.push(dateData['winning_numbers']);
    }
  }
  tableBody.innerHTML = tableBodyHtml;

  frequentCombos = []
  frequentCombos = getCombinations(winningNumberLists);

  let freqBodyHtml = '';
  for (let comboKey of [...frequentCombos.keys()].sort((a,b) => b.length - a.length)) {
    let combo = frequentCombos.get(comboKey);
    if (combo.length == comboSize) {
      combo.sort((a,b) => a - b);
      let dateIndices = comboKey.split('_').map(num => Number(num)); 
      let dates = dateIndices.map(index => data[index]['draw_date'].split('T')[0]);
      rowHtml = `<tr id="${comboKey}" onclick="highlightGroup(this.id)">`;
      rowHtml += `<td>${combo.join('  ')}</td>`;
      rowHtml += `<td>${dateIndices.length}</td>`;
      rowHtml += `<td>${dates.join(', ')}</td>`;
      rowHtml += `</tr>`;
      freqBodyHtml += rowHtml;
    }
  }
  freqTableBody.innerHTML = freqBodyHtml;
}

function highlightGroup(groupId) {
  if (highlightedGroup) {
    removeHighlight();
  }
  highlightedGroup = groupId;
  let group = frequentCombos.get(groupId);
  let dateIndices = groupId.split('_').map(num => Number(num)); 
  let dates = dateIndices.map(index => queryData[index]['draw_date'].split('T')[0]);

  for (let date of dates) {
    let dateRow = document.getElementById(date);
    let rowHeader = dateRow.childNodes[0];
    rowHeader.style.background = "#bff2d1"
    for (let num of group) {
      let numCell = dateRow.childNodes[num];
      numCell.style.background = "#bff2d1";
      numCell.style.color = "black";
    }
  }
}

function removeHighlight() {
  if (highlightedGroup) {
    let group = frequentCombos.get(highlightedGroup);
    let dateIndices = highlightedGroup.split('_').map(num => Number(num)); 
    let dates = dateIndices.map(index => queryData[index]['draw_date'].split('T')[0]);
  
    for (let date of dates) {
      let dateRow = document.getElementById(date);
      let rowHeader = dateRow.childNodes[0];
      rowHeader.style.background = "white"
      for (let num of group) {
        let numCell = dateRow.childNodes[num];
        numCell.style.background = "white";
        numCell.style.color = "rgb(18, 114, 50)";
      }
    }
    highlightedGroup = undefined;
  }
}

function getCombinations(winningNumberLists) {
  let numbersToLists = new Map();
  for (let i = 0; i < winningNumberLists.length; i++) {
    let winningNumbers = winningNumberLists[i];
    for (let j = 0; j < winningNumbers.length; j++) {
      let num = winningNumbers[j];
      let matchedLists = [];
      if (numbersToLists.has(num)){
        matchedLists = numbersToLists.get(num);
      } else {
        numbersToLists.set(num, matchedLists);
      }
      matchedLists.push(i);
    }
  }
  let matchingSubsets = new Map();
  for (let key of numbersToLists.keys()) {
    subsets = findAllSubsets(numbersToLists.get(key));
    for (let subset of subsets) {
      if (subset.length > 1) {
        numGroup = [];
        let setKey = getComboKey(subset);
        if (matchingSubsets.has(setKey)){
          numGroup = matchingSubsets.get(setKey);
        } else {
          matchingSubsets.set(setKey, numGroup);
        }
        numGroup.push(key);
      }
    }
  }
  return matchingSubsets;
}

function findAllSubsets(arr){
  arr.sort();
  const res = [[]];
  let count, subRes, preLength;
  for (let i = 0; i < arr.length; i++) {
     count = 1;
     while (arr[i + 1] && arr[i + 1] == arr[i]) {
        count += 1;
        i++;
     }
     preLength = res.length;
     for (let j = 0; j < preLength; j++) {
        subRes = res[j].slice();
        for (let x = 1; x <= count; x++) {
           if (x > 0) subRes.push(arr[i]);
           res.push(subRes.slice());
        }
     }
  };
  return res;
};

function getComboKey(numbers){
  numbers.sort();
  return numbers.join("_");
}

function getSubsetsWithLength(arr, length) {
  const result = [];

  // Recursive function to generate subsets
  function generateSubsets(currentSubset, start) {
      if (currentSubset.length === length) {
          result.push([...currentSubset]); // Add a copy of the currentSubset to the result
          return;
      }

      for (let i = start; i < arr.length; i++) {
          currentSubset.push(arr[i]);
          generateSubsets(currentSubset, i + 1);
          currentSubset.pop();
      }
  }

  generateSubsets([], 0);
  return result;
}
