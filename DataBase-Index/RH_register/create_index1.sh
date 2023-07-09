echo "Starting Docker container and data volume..."
# create the directory first to avoid permission issues when Docker is running as root
dir_path="C:/Users/Korisnik/Desktop/diplomski-Kniwy/customBaza/geonames_index"

if [ -d "$dir_path" ]; then
  # If the directory exists, remove it
  rm -r "$dir_path"
fi

# Create the new directory
mkdir "$dir_path"

container_id=$(docker run -d -p 127.0.0.1:9200:9200 -e "discovery.type=single-node" -v C:/Users/Korisnik/Desktop/diplomski-Kniwy/customBaza/geonames_index/:/usr/share/elasticsearch/data elasticsearch:7.10.1)

sleep 10
sleep 10
echo "Creating mappings for the fields in the Geonames index..."
curl -XPUT 'localhost:9200/geonames' -H 'Content-Type: application/json' -d @geonames_mapping.json

sleep 10
echo "Change disk availability limits..."
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "10gb",
    "cluster.routing.allocation.disk.watermark.high": "5gb",
    "cluster.routing.allocation.disk.watermark.flood_stage": "4gb",
    "cluster.info.update.interval": "1m"
  }
}
'

echo "Loading gazetteer into Elasticsearch..."
python geonames_elasticsearch_loader1.py

echo "Stopping Elasticsearch container..."
docker stop "$container_id"

echo "Removing Elasticsearch container..."
docker rm "$container_id"

echo "Container stopped and removed successfully."

echo "Done"
