const express = require('express');
const https = require('https');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ attrkey: "ATTR" });
const fs = require('fs'),
	request = require('request');

const xml = `https://www.boi.org.il/he/BankingSupervision/BanksAndBranchLocations/Lists/BoiBankBranchesDocs/snifim_dnld_he.xml`
console.log(xml)
const branches = JSON.parse(fs.readFileSync("results.json"))
const googleApiKey = 'AIzaSyD9Bsk2YHyvamJx0zy-EEat4D6ajVQGYyg'
const cors = require('cors');
let searchedBanks = [];
let searchedBranches = [];
// let searchedNames = [];
// let branchNumbers = [];
// let searchedBankNumbers = [];
// let chosenBank = [];
const bodyParser = require('body-parser');

//// functions /////
// fetches the XML, parses it and saves

const xmlFetching = function () {
	https.get(xml, function(res) {
	    let data = '';
	    res.on('data', function(stream) {
	        data += stream;
			
	    });
	    res.on('end', function(){
	        parser.parseString(data, function(error, result) {
	        	let bank = result['BRANCHES']['BRANCH']
	            if(error === null) {
	            	// console.log(result['BRANCHES']['BRANCH']);
	            	console.log('bla bla')
	            }
	            else {
	                console.log(error);
	            }
		        fs.writeFileSync('results.json', JSON.stringify(bank) , function(err, data) {
		    		console.log(data)
		    		if (err) {
				      console.log(err);
				    }
				    else {
				      console.log('updated!');
				    }	
		    	})
	        });
	    });
	});
}


// const bankNameToNumber
// Converting hebrew characters into numbers
const fixedCharCodeAt = function (str) {
	let code = [];
	for (let i = 0; i< str.length; i++ ) {
		let char = str.charCodeAt(i);
		code.push(char)
	}
  return code;
}
// Searching through the file
const searchedByName = function(file, name) {
	if(!name || !file) {
		return 'Somthing is missing'
	}
	const filteredBank = file.filter(bank => {
		return bank.Bank_Name.toString('utf-8').includes(name.toString('utf-8'))
	})
	return filteredBank
}

////////////////////


const app = express();

app.use(cors());
app.use(bodyParser.json());


app.get('/', (req, res, next)=> { 
	xmlFetching()
	res.send('Server uploaded successfully') 
})

// Get Bank Name By Character
app.post('/search-bank-name', (req,res) => {
	const { input } = req.body

	let searchedNames = {};
	searchedBanks = searchedByName(branches , input);

	if (searchedBanks.length === 0) {
		return res.status(400).json(['no such bank!!'] );
	}

	if (input <= 0) {
		return res.status(200).json(['Please type Bank Name'] );
	}

	for (i = 0 ; i < searchedBanks.length; i++) {
		if(!searchedNames[searchedBanks[i]]) {
			let name = searchedBanks[i].Bank_Name.toString('utf-8');
			searchedNames[name] = true;
		}
		// searchedNames.push(searchedBanks[i].Bank_Name.toString())
	}
	// res.json(searchedNames)
	res.json(Object.keys(searchedNames))
	return searchedBanks
} )
// Get Bank Name By Bank Name
app.put('/search-branch-number', (req, res) => {
	const { bankName, input } = req.body
	
	let branchNumbers = {};
	let searched = searchedByName(searchedBanks , bankName)
	searchedBranches = searched.filter(bank => {
		return bank.Branch_Code.toString('utf-8').includes(input.toString('utf-8'))
	})
	if (bankName <= 0) {
		return res.status(200).json(['Please type Bank Name'] );
	}

	if (searchedBranches.length === 0) {
		return res.status(400).json(['No Such branch number'] );
	}

	for (i = 0 ; i < searchedBranches.length; i++) {
		if(!branchNumbers[searchedBranches[i]]) {
			let number = searchedBranches[i].Branch_Code.toString('utf-8');
			branchNumbers[number] = true;
		}
	}
	res.json(Object.keys(branchNumbers))
	return searchedBranches
})

// Get Bank Information by Bank name and Branch Number
app.post('/bank-information', (req,res) => {
	const { bankName, branchNumber } = req.body

	if (!bankName || !branchNumber ) {
		return res.status(400).json(['incorrect information submitted'] );
	}

	// searchedBanks = searched(branches , bankName)
	chosenBank = searchedBranches.filter(branch => {
		if (branchNumber === branch.Branch_Code.toString('utf-8') && bankName === branch.Bank_Name.toString('utf-8')) {
			return branch
		}
	})
	res.json(chosenBank)
	return chosenBank
})
// google image 
app.put('/google-location-image', (req,res) => {
	const { bankInfo, bankName } = req.body
	// console.log(typeof bankInfo)
	if (bankName.length > 0) {
		let bankLocation = `https://maps.googleapis.com/maps/api/staticmap?center=${bankInfo.Y_Coordinate},${bankInfo.X_Coordinate}&zoom=15&size=600x320&maptype=roadmap&markers=color:green%7Clabel:Bank%7C${bankInfo.Y_Coordinate},${bankInfo.X_Coordinate}&key=${googleApiKey}`
	 	console.log(bankLocation)
	 	let download = function(url, filename, callback) {
	 		request.head(url, function(err, res, body){
			    console.log('content-type:', res.headers['content-type']);
			    console.log('content-length:', res.headers['content-length']);

			    request(url).pipe(fs.createWriteStream(filename)).on('close', callback);
			});
		};

		download(bankLocation, 'google.png', function() {
			fs.readFile('google.png', function (err, data) {
		        var contentType = 'image/png';
		        var base64 = Buffer.from(data).toString('base64');
		        base64 = 'data:image/png;base64,'+ base64;
		        res.json(base64);
		    })
		  console.log('done');
		});
	} else {
		return res.status(400).json(['Please Choose Vlid Bank name'] );
	}
})


const PORT = process.env.PORT
app.listen(PORT || 3000, ()=> {
	console.log(`Server is listening on port ${PORT}`)
})

console.log(PORT)

/*
/ --> res = this is working

*/