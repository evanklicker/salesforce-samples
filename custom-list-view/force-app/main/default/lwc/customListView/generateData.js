// all possible characters in an Id string, with a preference for numbers (esp. 0)
const idCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz000000000000000000000000000000000000000000000000111122223333444455556666777788889999";
const getSampleId = function(length) {
    let string = '';
    for (let i = 0; i < length; i++) {
        string += idCharacters[Math.floor((Math.random() * idCharacters.length))];
    }
    return string;
}

export default function generateData({ amountOfRecords }) {
    return [...Array(amountOfRecords)].map((_, index) => {
        let id = `001${getSampleId(12)}`;
        return {
            id: id,
            name: `Name (${index+1})`,
            url: `/${id}`,
            website: 'www.salesforce.com',
            amount: Math.floor(Math.random() * 100),
            phone: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            closeAt: new Date(
                Date.now() + 86400000 * Math.ceil(Math.random() * 20)
            ),
        };
    });
}