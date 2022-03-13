import json, requests, time, os
from bs4 import BeautifulSoup

data = []

with open("bare.json", "r") as f:
    data = json.load(f)

for artist in data:
    try:
        print(artist)
        directory = "../images/" + artist["id"] + "/"
        os.mkdir(directory)

        url = "https://www.wikiart.org/en/" + artist["id"]
        r = requests.get(url)
        soup = BeautifulSoup(r.text, features="lxml")

        profile = soup.find("img", itemprop="image")["src"]
        binary = requests.get(profile)
        with open(directory + "profile.jpg", "wb") as f:
            f.write(binary.content)
        time.sleep(1)

        for el in soup.findAll("li", {"class" : "dictionary-values"}):
            # remove the :, lower everything and slugify
            key = el.find("s").text[0:-1].lower().replace(" ", "-")
            value = []
            for a in el.findAll("a"):
                value.append(a.text)

            artist[key] = value

        imgs = []
        img_element = soup.find("section", {"class": "wiki-layout-artworks-famous"})
        i = 0
        for img in img_element.findAll("img"):
            src = img["img-source"].split("'")[1]
            binary = requests.get(src)
            time.sleep(1)
            with open(directory + str(i) + "-smol.jpg", "wb") as f:
                f.write(binary.content)
            src = src.split("!")[0]
            binary = requests.get(src)
            time.sleep(1)
            with open(directory + str(i) + "-orig.jpg", "wb") as f:
                f.write(binary.content)

            i += 1



        try:
            artist["birthplace"] = soup.find("span", itemprop="birthPlace").text
        except:
            artist["birthplace"] = "-"
        try:
            artist["birthdata"] = soup.find("span", itemprop="birthDate").text
        except:
            artist["birthdata"] = "-"
        try:
            artist["deathplace"] = soup.find("span", itemprop="deathPlace").text
        except:
            artist["deathplace"] = "-"
        try:
            artist["deathdata"] = soup.find("span", itemprop="deathDate").text
        except:
            artist["deathdata"] = "-"
    except Exception as e:
        print("error with: ", artist["id"], e)
        continue

    time.sleep(1)


with open("artists.json", "w") as f:
    f.write(json.dumps(data))
