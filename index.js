import fs from "fs";

const gsocYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

function gsocJsonFilePath(year) {
    return "./GSoC/" + year + ".json";
}

class organizationData {
    parentOrganizationsData = {};
    idAndURLHashMap = {};
    totalcategories = new Set();
    totalTopics = new Set();
    totalTechnologies = new Set();

    _getIdFromOrgName(name, url) {
        const idName = name.replace(/[^a-zA-Z\d ]/g, '').split(' ').join('');
        const idURL = url.replace(/^(https?:\/\/)?(www\.)?/, '').replace("/", "");

        if (this.idAndURLHashMap[idURL]) return this.idAndURLHashMap[idURL];
        else if (this.idAndURLHashMap[idName]) return this.idAndURLHashMap[idName];

        this.idAndURLHashMap[idName] = idName;
        this.idAndURLHashMap[idURL] = idName;

        return idName;
    }

    _mergeChanges(id, obj, year) {
        if (this.parentOrganizationsData[id].image_url === "" ||
            this.parentOrganizationsData[id].year[this.parentOrganizationsData[id].year.length - 1] < year) {
            this.parentOrganizationsData[id].image_url = obj.image_url;
        }

        if (this.parentOrganizationsData[id].image_background_color === "" ||
            obj.image_background_color) {
            this.parentOrganizationsData[id].image_url = obj.image_background_color;
        }

        if (this.parentOrganizationsData[id].description === "" ||
            this.parentOrganizationsData[id].year[this.parentOrganizationsData[id].year.length - 1] < year) {
            this.parentOrganizationsData[id].description = obj.description;
        }

        if (this.parentOrganizationsData[id].year[this.parentOrganizationsData[id].year.length - 1] < year) {
            this.parentOrganizationsData[id].url = obj.url;
        }

        if (Array.isArray(obj.category) && obj.category) {
            this.parentOrganizationsData[id].category = [...new Set(
                [...this.parentOrganizationsData[id].category, ...obj.category])];
        } else if (obj.category) {
            this.parentOrganizationsData[id].category = [...new Set(
                [...this.parentOrganizationsData[id].category, ...[obj.category]])];
        }

        this.parentOrganizationsData[id].topics = [...new Set(
            [...this.parentOrganizationsData[id].topics, ...obj.topics])];

        this.parentOrganizationsData[id].technologies = [...new Set(
            [...this.parentOrganizationsData[id].technologies, ...obj.technologies])];

        if (obj.irc_channel) {
            this.parentOrganizationsData[id].irc_channel = obj.irc_channel;
        }

        if (obj.contact_email)
            this.parentOrganizationsData[id].contact_email = obj.contact_email;

        if (obj.mailing_list)
            this.parentOrganizationsData[id].mailing_list = obj.mailing_list;

        if (obj.twitter_url)
            this.parentOrganizationsData[id].twitter_url = obj.twitter_url;

        if (obj.blog_url)
            this.parentOrganizationsData[id].blog_url = obj.blog_url;

        if (obj.facebook_url)
            this.parentOrganizationsData[id].facebook_url = obj.facebook_url;

        this.parentOrganizationsData[id].year = [...new Set(
            [...this.parentOrganizationsData[id].year, ...[year]])];

        this.parentOrganizationsData[id].projects[[year]] = obj.projects;
    }

    add(obj, year) {
        const id = this._getIdFromOrgName(obj.name, obj.url);

        if (Array.isArray(obj.category))
            this.totalcategories = [...new Set(
                [...this.totalcategories, ...obj.category])];
        else {
            this.totalcategories.add(obj.category);
        }

        if (Array.isArray(obj.topics))
            this.totalTopics = [...new Set(
                [...this.totalTopics, ...obj.topics])];
        else {
            this.totalTopics.add(obj.topics);
        }

        if (Array.isArray(obj.topics))
            this.totalTechnologies = [...new Set(
                [...this.totalTechnologies, ...obj.technologies])];
        else {
            this.totalTechnologies.add(obj.technologies);
        }

        if (this.parentOrganizationsData[id]) {
            this._mergeChanges(id, obj, year);
        } else {
            this.parentOrganizationsData[id] = {
                name: obj.name,
                image_url: obj.image_url,
                image_background_color: obj.image_background_color,
                description: obj.description,
                url: obj.url,
                category: Array.isArray(obj.category) ? [...obj.category] : [obj.category],
                topics: Array.isArray(obj.topics) ? [...obj.topics] : [obj.topics],
                technologies: Array.isArray(obj.technologies) ? [...obj.technologies] : [obj.technologies],
                irc_channel: obj.irc_channel,
                contact_email: obj.contact_email,
                mailing_list: obj.mailing_list,
                twitter_url: obj.twitter_url,
                blog_url: obj.blog_url,
                facebook_url: obj.facebook_url,
                year: [year],
                projects: { [year]: [...obj.projects] }
            }
        }
    }


}

function fetchOrganizationsData(compiledOrgsData) {
    for (const year of gsocYears) {
        const data = JSON.parse(fs.readFileSync(gsocJsonFilePath(year)));

        for (const orgObj of data.organizations) {
            compiledOrgsData.add(orgObj, year);
        }
    }
}

const objectSorter = (GFG_Object) => 
    Object.keys(GFG_Object)  
      .sort()
      .reduce((finalObject, key) => {  
        finalObject[key] = GFG_Object[key];  
        return finalObject;  
    }, {}); 

function compileData() {
    let compiledOrgsData = new organizationData();

    fetchOrganizationsData(compiledOrgsData);

    const finalData = JSON.stringify({
        orgData: objectSorter(compiledOrgsData.parentOrganizationsData),
        totalcategories: [...compiledOrgsData.totalcategories],
        totalTopics: [...compiledOrgsData.totalTopics],
        totalTechnologies: [...compiledOrgsData.totalTechnologies],
    }, null, 2);

    fs.writeFile('./CompiledData/my.json', finalData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file', err);
        } else {
            console.log('JSON file has been saved.');
        }
    });
}

compileData();