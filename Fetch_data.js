const fetchData = async (Model) => {
  try {
    const data = await Model.find();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

module.exports = fetchData;
